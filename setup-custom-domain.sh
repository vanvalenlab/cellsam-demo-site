#!/bin/bash
# setup-custom-domain.sh

set -e

AWS_PROFILE="${AWS_PROFILE:-cellsam}"
AWS_REGION="${AWS_REGION:-us-west-1}"
DOMAIN_NAME="${DOMAIN_NAME:-cellsam.deepcell.org}"
PROJECT_NAME="${PROJECT_NAME:-cellsam-demo}"

echo "🌐 Setting up custom domain: $DOMAIN_NAME"

# Step 1: Check if certificate already exists or request new one
echo "📜 Checking for existing SSL certificate..."
EXISTING_CERTIFICATE_ARN=$(aws acm list-certificates \
    --profile $AWS_PROFILE \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text)

if [ "$EXISTING_CERTIFICATE_ARN" != "" ]; then
    CERTIFICATE_ARN=$EXISTING_CERTIFICATE_ARN
    echo "✅ Using existing certificate: $CERTIFICATE_ARN"
else
    echo "📜 Requesting new SSL certificate..."
    CERTIFICATE_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN_NAME \
        --validation-method DNS \
        --profile $AWS_PROFILE \
        --region us-east-1 \
        --query 'CertificateArn' \
        --output text)
    echo "✅ Created new certificate: $CERTIFICATE_ARN"
fi

# Step 2: Get validation records
echo "📋 Getting DNS validation records..."
VALIDATION_RECORD=$(aws acm describe-certificate \
    --certificate-arn $CERTIFICATE_ARN \
    --profile $AWS_PROFILE \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

VALIDATION_NAME=$(echo $VALIDATION_RECORD | jq -r '.Name')
VALIDATION_VALUE=$(echo $VALIDATION_RECORD | jq -r '.Value')

echo "Certificate validation record:"
echo "  Name: $VALIDATION_NAME"
echo "  Value: $VALIDATION_VALUE"

# Check certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn $CERTIFICATE_ARN \
    --profile $AWS_PROFILE \
    --region us-east-1 \
    --query 'Certificate.Status' \
    --output text)

echo "Certificate status: $CERT_STATUS"

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "⚠️  Certificate is not yet validated. Please add the DNS records below and wait for validation."
    echo "   Certificate will be validated automatically once DNS records are added."
    echo ""
    echo "📋 EXACT DNS RECORDS TO CREATE:"
    echo ""
    echo "Go to your DNS provider (where deepcell.org is managed) and create these EXACT records:"
    echo ""
    echo "1. CERTIFICATE VALIDATION RECORD (CNAME):"
    echo "   Host/Name: $VALIDATION_NAME"
    echo "   Value/Points to: $VALIDATION_VALUE"
    echo "   TTL: 300 (or default)"
    echo ""
    echo "⚠️  IMPORTANT: Certificate must be validated before proceeding with HTTPS setup."
    echo "   Run this script again after adding the DNS record and certificate is validated."
    exit 0
fi

# Step 3: Get ALB DNS name
echo "🔗 Getting ALB DNS name..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names $PROJECT_NAME-alb \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "ALB DNS: $ALB_DNS"

# Step 4: Add HTTPS to ALB security group
echo "🔒 Adding HTTPS to ALB security group..."
ALB_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$PROJECT_NAME-alb-sg" \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --profile $AWS_PROFILE \
    --region $AWS_REGION 2>/dev/null || echo "✅ HTTPS rule already exists"

# Step 5: Get ALB and Target Group ARNs
echo "⚖️ Getting ALB and Target Group information..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names $PROJECT_NAME-alb \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names $PROJECT_NAME-tg \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Step 6: Check if HTTPS listener already exists
echo "🔍 Checking for existing HTTPS listener..."
EXISTING_HTTPS_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Listeners[?Port==`443`].ListenerArn' \
    --output text)

if [ "$EXISTING_HTTPS_LISTENER" != "" ]; then
    echo "✅ HTTPS listener already exists"
else
    echo "⚖️ Creating HTTPS listener..."
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTPS \
        --port 443 \
        --certificates CertificateArn=$CERTIFICATE_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ HTTPS listener created"
fi

# Step 7: Update HTTP listener to redirect
echo "🔄 Setting up HTTP to HTTPS redirect..."
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

# Check if HTTP listener already redirects
CURRENT_HTTP_ACTION=$(aws elbv2 describe-listeners \
    --listener-arns $HTTP_LISTENER_ARN \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'Listeners[0].DefaultActions[0].Type' \
    --output text)

if [ "$CURRENT_HTTP_ACTION" = "redirect" ]; then
    echo "✅ HTTP listener already redirects to HTTPS"
else
    echo "🔄 Updating HTTP listener to redirect to HTTPS..."
    aws elbv2 modify-listener \
        --listener-arn $HTTP_LISTENER_ARN \
        --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    echo "✅ HTTP listener updated to redirect to HTTPS"
fi

echo ""
echo "✅ Custom domain setup completed!"
echo ""
echo "📋 EXACT DNS RECORDS TO CREATE:"
echo ""
echo "Go to your DNS provider (where deepcell.org is managed) and create these EXACT records:"
echo ""
echo "1. CERTIFICATE VALIDATION RECORD (CNAME):"
echo "   Host/Name: $VALIDATION_NAME"
echo "   Value/Points to: $VALIDATION_VALUE"
echo "   TTL: 300 (or default)"
echo ""
echo "2. DOMAIN MAPPING RECORD (CNAME):"
echo "   Host/Name: cellsam.deepcell.org"
echo "   Value/Points to: $ALB_DNS"
echo "   TTL: 300 (or default)"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   - Do NOT include 'http://' or 'https://' in the values"
echo "   - The certificate validation record name will look like: _abc123.cellsam.deepcell.org"
echo "   - The domain mapping record name should be exactly: cellsam.deepcell.org"
echo "   - Both records should be CNAME type"
echo ""
echo "3. Wait for certificate validation (5-30 minutes)"
echo ""
echo "4. Test your site:"
echo "   - http://cellsam.deepcell.org (should redirect to HTTPS)"
echo "   - https://cellsam.deepcell.org (should show your app)"
echo ""
echo "🔍 Monitor certificate status:"
echo "   aws acm describe-certificate --certificate-arn $CERTIFICATE_ARN --profile $AWS_PROFILE --region us-east-1"