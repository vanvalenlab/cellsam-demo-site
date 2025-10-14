#!/bin/bash

# Complete ECS Fargate Deployment Script for us-west-1
# Run with: bash deploy-fargate.sh

set -e

AWS_PROFILE="cellsam"
AWS_REGION="us-west-1"

echo "🚀 Starting complete ECS Fargate deployment in $AWS_REGION..."

# Get AWS Account ID
echo "📋 Getting AWS Account ID..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Step 1: Create ECR Repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
    --repository-name cellsam-demo-site \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Repository may already exist"

# Step 2: Build and Push Docker Image
echo "🔨 Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | \
    docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build --platform linux/amd64 -t cellsam-demo-site .
docker tag cellsam-demo-site:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/cellsam-demo-site:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/cellsam-demo-site:latest

echo "✅ Docker image pushed successfully!"

# Step 3: Update Task Definition with Account ID
echo "📝 Creating final task definition..."
sed "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" ecs-task-definition.json > ecs-task-definition-final.json

# Step 4: Create CloudWatch Log Group
echo "📊 Creating CloudWatch log group..."
aws logs describe-log-groups \
    --log-group-name-prefix /ecs/cellsam-demo-site \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'logGroups[?logGroupName==`/ecs/cellsam-demo-site`]' \
    --output text > /dev/null 2>&1 || {
    aws logs create-log-group \
        --log-group-name /ecs/cellsam-demo-site \
        --region $AWS_REGION \
        --profile $AWS_PROFILE
    echo "✅ CloudWatch log group created"
} && echo "✅ CloudWatch log group already exists"

# Step 5: Create/Verify ECS Task Execution Role
echo "🔐 Setting up ECS task execution role..."
aws iam get-role --role-name ecsTaskExecutionRole --profile $AWS_PROFILE > /dev/null 2>&1 || {
    echo "Creating ECS task execution role..."
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --profile $AWS_PROFILE
    
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
        --profile $AWS_PROFILE
    
    echo "Waiting for role to propagate..."
    sleep 10
}

# Step 6: Create ECS Cluster
echo "🏗️ Creating ECS cluster..."
aws ecs describe-clusters \
    --clusters cellsam-demo-cluster \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'clusters[?status==`ACTIVE`]' \
    --output text > /dev/null 2>&1 && {
    echo "✅ ECS cluster already exists"
} || {
    aws ecs create-cluster \
        --cluster-name cellsam-demo-cluster \
        --capacity-providers FARGATE \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
        --region $AWS_REGION \
        --profile $AWS_PROFILE
    echo "✅ ECS cluster created"
}

# Step 7: Register Task Definition
echo "📋 Registering task definition..."
aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition-final.json \
    --region $AWS_REGION \
    --profile $AWS_PROFILE

# Step 8: Create VPC Infrastructure
echo "🌐 Creating VPC infrastructure..."

# Check if VPC already exists
EXISTING_VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=cidr-block,Values=10.0.0.0/16" "Name=state,Values=available" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null)

if [ "$EXISTING_VPC_ID" != "None" ] && [ "$EXISTING_VPC_ID" != "" ]; then
    VPC_ID=$EXISTING_VPC_ID
    echo "✅ Using existing VPC: $VPC_ID"
else
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'Vpc.VpcId' \
        --output text)
    echo "✅ Created new VPC: $VPC_ID"
fi

# Enable DNS hostnames for VPC
aws ec2 modify-vpc-attribute \
    --vpc-id $VPC_ID \
    --enable-dns-hostnames \
    --profile $AWS_PROFILE \
    --region $AWS_REGION

# Create or find Internet Gateway
EXISTING_IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'InternetGateways[0].InternetGatewayId' \
    --output text 2>/dev/null)

if [ "$EXISTING_IGW_ID" != "None" ] && [ "$EXISTING_IGW_ID" != "" ]; then
    IGW_ID=$EXISTING_IGW_ID
    echo "✅ Using existing Internet Gateway: $IGW_ID"
else
    IGW_ID=$(aws ec2 create-internet-gateway \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    
    # Attach Internet Gateway to VPC
    aws ec2 attach-internet-gateway \
        --internet-gateway-id $IGW_ID \
        --vpc-id $VPC_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ Created and attached Internet Gateway: $IGW_ID"
fi

# Create or find public subnets in different AZs
EXISTING_SUBNET1_ID=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=cidr-block,Values=10.0.1.0/24" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Subnets[0].SubnetId' \
    --output text 2>/dev/null)

if [ "$EXISTING_SUBNET1_ID" != "None" ] && [ "$EXISTING_SUBNET1_ID" != "" ]; then
    SUBNET1_ID=$EXISTING_SUBNET1_ID
    echo "✅ Using existing subnet 1: $SUBNET1_ID"
else
    SUBNET1_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.1.0/24 \
        --availability-zone us-west-1a \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'Subnet.SubnetId' \
        --output text)
    echo "✅ Created subnet 1: $SUBNET1_ID"
fi

EXISTING_SUBNET2_ID=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=cidr-block,Values=10.0.2.0/24" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Subnets[0].SubnetId' \
    --output text 2>/dev/null)

if [ "$EXISTING_SUBNET2_ID" != "None" ] && [ "$EXISTING_SUBNET2_ID" != "" ]; then
    SUBNET2_ID=$EXISTING_SUBNET2_ID
    echo "✅ Using existing subnet 2: $SUBNET2_ID"
else
    SUBNET2_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.2.0/24 \
        --availability-zone us-west-1c \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'Subnet.SubnetId' \
        --output text)
    echo "✅ Created subnet 2: $SUBNET2_ID"
fi

# Enable auto-assign public IP for subnets
aws ec2 modify-subnet-attribute \
    --subnet-id $SUBNET1_ID \
    --map-public-ip-on-launch \
    --profile $AWS_PROFILE \
    --region $AWS_REGION

aws ec2 modify-subnet-attribute \
    --subnet-id $SUBNET2_ID \
    --map-public-ip-on-launch \
    --profile $AWS_PROFILE \
    --region $AWS_REGION

# Create or find route table
EXISTING_ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=route.gateway-id,Values=$IGW_ID" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'RouteTables[0].RouteTableId' \
    --output text 2>/dev/null)

if [ "$EXISTING_ROUTE_TABLE_ID" != "None" ] && [ "$EXISTING_ROUTE_TABLE_ID" != "" ]; then
    ROUTE_TABLE_ID=$EXISTING_ROUTE_TABLE_ID
    echo "✅ Using existing route table: $ROUTE_TABLE_ID"
else
    ROUTE_TABLE_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'RouteTable.RouteTableId' \
        --output text)
    
    aws ec2 create-route \
        --route-table-id $ROUTE_TABLE_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id $IGW_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ Created route table: $ROUTE_TABLE_ID"
fi

# Associate subnets with route table (safe to run multiple times)
aws ec2 associate-route-table \
    --subnet-id $SUBNET1_ID \
    --route-table-id $ROUTE_TABLE_ID \
    --profile $AWS_PROFILE \
    --region $AWS_REGION 2>/dev/null || echo "Subnet 1 already associated"

aws ec2 associate-route-table \
    --subnet-id $SUBNET2_ID \
    --route-table-id $ROUTE_TABLE_ID \
    --profile $AWS_PROFILE \
    --region $AWS_REGION 2>/dev/null || echo "Subnet 2 already associated"

echo "✅ VPC infrastructure created successfully!"

# Step 9: Create Security Groups
echo "🔒 Creating security groups..."

# Create or find ALB security group
EXISTING_ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=cellsam-alb-sg" "Name=vpc-id,Values=$VPC_ID" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$EXISTING_ALB_SG_ID" != "None" ] && [ "$EXISTING_ALB_SG_ID" != "" ]; then
    ALB_SG_ID=$EXISTING_ALB_SG_ID
    echo "✅ Using existing ALB security group: $ALB_SG_ID"
else
    ALB_SG_ID=$(aws ec2 create-security-group \
        --group-name cellsam-alb-sg \
        --description "Security group for ALB" \
        --vpc-id $VPC_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    
    # Allow HTTP traffic to ALB
    aws ec2 authorize-security-group-ingress \
        --group-id $ALB_SG_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ Created ALB security group: $ALB_SG_ID"
fi

# Create or find ECS security group
EXISTING_ECS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=cellsam-ecs-sg" "Name=vpc-id,Values=$VPC_ID" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$EXISTING_ECS_SG_ID" != "None" ] && [ "$EXISTING_ECS_SG_ID" != "" ]; then
    ECS_SG_ID=$EXISTING_ECS_SG_ID
    echo "✅ Using existing ECS security group: $ECS_SG_ID"
else
    ECS_SG_ID=$(aws ec2 create-security-group \
        --group-name cellsam-ecs-sg \
        --description "Security group for ECS tasks" \
        --vpc-id $VPC_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    
    # Allow traffic from ALB to ECS tasks
    aws ec2 authorize-security-group-ingress \
        --group-id $ECS_SG_ID \
        --protocol tcp \
        --port 80 \
        --source-group $ALB_SG_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ Created ECS security group: $ECS_SG_ID"
fi

# Step 10: Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."

# Check if ALB already exists
EXISTING_ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names cellsam-demo-alb \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null)

if [ "$EXISTING_ALB_ARN" != "None" ] && [ "$EXISTING_ALB_ARN" != "" ]; then
    ALB_ARN=$EXISTING_ALB_ARN
    echo "✅ Using existing ALB: $ALB_ARN"
else
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name cellsam-demo-alb \
        --subnets $SUBNET1_ID $SUBNET2_ID \
        --security-groups $ALB_SG_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)
    echo "✅ Created ALB: $ALB_ARN"
fi

# Check if target group already exists
EXISTING_TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names cellsam-demo-tg \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null)

if [ "$EXISTING_TARGET_GROUP_ARN" != "None" ] && [ "$EXISTING_TARGET_GROUP_ARN" != "" ]; then
    TARGET_GROUP_ARN=$EXISTING_TARGET_GROUP_ARN
    echo "✅ Using existing target group: $TARGET_GROUP_ARN"
else
    TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
        --name cellsam-demo-tg \
        --protocol HTTP \
        --port 80 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-path / \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
    echo "✅ Created target group: $TARGET_GROUP_ARN"
fi

# Check if listener already exists
EXISTING_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Listeners[0].ListenerArn' \
    --output text 2>/dev/null)

if [ "$EXISTING_LISTENER" != "None" ] && [ "$EXISTING_LISTENER" != "" ]; then
    echo "✅ Using existing listener"
else
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ Created listener"
fi

echo "✅ Load balancer setup completed!"

# Step 11: Create or Update ECS Service
echo "🚀 Creating or updating ECS service..."

# Check if service already exists
EXISTING_SERVICE=$(aws ecs describe-services \
    --cluster cellsam-demo-cluster \
    --services cellsam-demo-service \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'services[?status==`ACTIVE`]' \
    --output text 2>/dev/null)

if [ "$EXISTING_SERVICE" != "" ]; then
    echo "✅ Service exists, updating with new task definition..."
    aws ecs update-service \
        --cluster cellsam-demo-cluster \
        --service cellsam-demo-service \
        --task-definition cellsam-demo-site \
        --desired-count 2 \
        --force-new-deployment \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ ECS service updated successfully!"
else
    echo "✅ Creating new ECS service..."
    aws ecs create-service \
        --cluster cellsam-demo-cluster \
        --service-name cellsam-demo-service \
        --task-definition cellsam-demo-site \
        --desired-count 2 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
        --load-balancers targetGroupArn=$TARGET_GROUP_ARN,containerName=cellsam-demo-site,containerPort=80 \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ ECS service created successfully!"
fi

# Step 12: Get Application URL
echo "🌐 Getting application URL..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Your application will be available at: http://$ALB_DNS"
echo ""
echo "⏰ Note: It may take 2-3 minutes for the service to become healthy and start serving traffic."
echo ""
echo "🔍 To monitor the deployment:"
echo "   aws ecs describe-services --cluster cellsam-demo-cluster --services cellsam-demo-service --profile $AWS_PROFILE --region $AWS_REGION"
echo ""
echo "📊 To view logs:"
echo "   aws logs tail /ecs/cellsam-demo-site --follow --profile $AWS_PROFILE --region $AWS_REGION"
