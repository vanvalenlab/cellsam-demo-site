# AWS ECS Fargate Deployment

A complete deployment solution for containerized applications on AWS ECS Fargate with Application Load Balancer, HTTPS, and custom domain support.

## Features

- 🚀 **One-click deployment** to AWS ECS Fargate
- ⚖️ **Application Load Balancer** with health checks
- 🔒 **HTTPS/SSL** with AWS Certificate Manager
- 🌐 **Custom domain** support
- 📊 **CloudWatch logging** integration
- 🔄 **Idempotent scripts** - safe to run multiple times
- 💰 **Cost-optimized** configuration

## Quick Start

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Docker** installed locally
3. **AWS Profile** set up (e.g., `aws configure --profile your-profile`)

### 1. Configuration

Copy the environment template and update with your values:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
AWS_PROFILE=your-aws-profile-name
AWS_REGION=us-west-1
PROJECT_NAME=your-project-name
DOMAIN_NAME=your-domain.com  # Optional
```

### 2. Deploy to AWS

```bash
bash deploy-fargate.sh
```

This script will:
- Create ECR repository and push Docker image
- Set up VPC, subnets, security groups
- Create ECS cluster and task definition
- Deploy Application Load Balancer
- Launch ECS service with 2 running tasks

## Scripts Overview

| Script | Purpose |
|--------|---------|
| `deploy-fargate.sh` | Complete ECS Fargate deployment |
| `get-dns-info.sh` | Generate DNS records for custom domain |
| `check-certificate.sh` | Monitor SSL certificate validation |
| `setup-https.sh` | Configure HTTPS and redirects |

## Architecture

```
Internet → ALB → ECS Fargate Tasks
           ↓
    CloudWatch Logs
```

- **Application Load Balancer**: Routes traffic and performs health checks
- **ECS Fargate**: Serverless container hosting (2 tasks by default)
- **ECR**: Private Docker registry
- **CloudWatch**: Centralized logging
- **Certificate Manager**: Free SSL certificates

## Cost Estimation

**Monthly costs (us-west-1):**
- ECS Fargate (2 tasks): ~$18
- Application Load Balancer: ~$18
- CloudWatch Logs: ~$1
- **Total: ~$37/month**

## Customization

### Environment Variables

All configuration is handled through environment variables:

- `AWS_PROFILE`: AWS CLI profile to use
- `AWS_REGION`: AWS region for deployment
- `PROJECT_NAME`: Used for naming AWS resources
- `DOMAIN_NAME`: Custom domain (optional)

### Task Definition

Edit `ecs-task-definition.json` to customize:
- CPU/Memory allocation
- Environment variables
- Port mappings
- Health check settings

### Scaling

Update desired task count:
```bash
aws ecs update-service \
  --cluster $PROJECT_NAME-cluster \
  --service $PROJECT_NAME-service \
  --desired-count 3 \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

## Monitoring

### View logs:
```bash
aws logs tail /ecs/$PROJECT_NAME --follow --profile $AWS_PROFILE --region $AWS_REGION
```

### Check service status:
```bash
aws ecs describe-services \
  --cluster $PROJECT_NAME-cluster \
  --services $PROJECT_NAME-service \
  --profile $AWS_PROFILE \
  --region $AWS_REGION
```

## Security

- All scripts use environment variables and AWS profiles
- No hardcoded credentials or sensitive information
- Security groups follow least-privilege principle
- HTTPS enforced with automatic HTTP redirects

## Troubleshooting

### Common Issues

1. **"exec format error"**: Docker image built for wrong architecture
   - Solution: Script uses `--platform linux/amd64` flag

2. **Certificate validation fails**: DNS records not added correctly
   - Solution: Double-check CNAME records with `nslookup`

3. **Tasks not starting**: Check CloudWatch logs for errors
   - Solution: `aws logs tail /ecs/$PROJECT_NAME --follow`

### Cleanup

To remove all AWS resources:
```bash
# Delete ECS service
aws ecs update-service --cluster $PROJECT_NAME-cluster --service $PROJECT_NAME-service --desired-count 0
aws ecs delete-service --cluster $PROJECT_NAME-cluster --service $PROJECT_NAME-service

# Delete other resources through AWS Console or CLI
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your AWS account
5. Submit a pull request

## License

MIT License - see LICENSE file for details.