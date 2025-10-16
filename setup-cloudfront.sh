#!/bin/bash
# setup-cloudfront.sh

set -e

AWS_PROFILE="${AWS_PROFILE:-cellsam}"
AWS_REGION="${AWS_REGION:-us-west-1}"
DOMAIN_NAME="${DOMAIN_NAME:-cellsam.deepcell.org}"
PROJECT_NAME="${PROJECT_NAME:-cellsam-demo}"

echo "🌐 Setting up CloudFront with custom domain: $DOMAIN_NAME"

# Get ALB DNS name
echo "🔗 Getting ALB DNS name..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names $PROJECT_NAME-alb \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "ALB DNS: $ALB_DNS"

# Get certificate ARN from us-east-1
echo "📜 Getting SSL certificate..."
CERTIFICATE_ARN=$(aws acm list-certificates \
    --profile $AWS_PROFILE \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text)

echo "Certificate ARN: $CERTIFICATE_ARN"

# Create CloudFront distribution WITH custom domain and certificate
echo "☁️ Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config '{
        "CallerReference": "'$(date +%s)'",
        "Comment": "CloudFront for '${DOMAIN_NAME}'",
        "DefaultCacheBehavior": {
            "TargetOriginId": "ALB-Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "TrustedSigners": {
                "Enabled": false,
                "Quantity": 0
            },
            "ForwardedValues": {
                "QueryString": true,
                "Cookies": {
                    "Forward": "none"
                }
            },
            "MinTTL": 0,
            "DefaultTTL": 0,
            "MaxTTL": 31536000
        },
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "ALB-Origin",
                    "DomainName": "'${ALB_DNS}'",
                    "CustomOriginConfig": {
                        "HTTPPort": 80,
                        "HTTPSPort": 443,
                        "OriginProtocolPolicy": "http-only"
                    }
                }
            ]
        },
        "Aliases": {
            "Quantity": 1,
            "Items": ["'${DOMAIN_NAME}'"]
        },
        "ViewerCertificate": {
            "ACMCertificateArn": "'${CERTIFICATE_ARN}'",
            "SSLSupportMethod": "sni-only",
            "MinimumProtocolVersion": "TLSv1.2_2021"
        },
        "DefaultRootObject": "",
        "Enabled": true,
        "PriceClass": "PriceClass_100"
    }' \
    --profile $AWS_PROFILE \
    --query 'Distribution.Id' \
    --output text)

echo "CloudFront Distribution ID: $DISTRIBUTION_ID"

# Get CloudFront domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id $DISTRIBUTION_ID \
    --profile $AWS_PROFILE \
    --query 'Distribution.DomainName' \
    --output text)

echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"

echo ""
echo "✅ CloudFront setup completed!"
echo ""
echo "📋 DNS RECORD TO CREATE:"
echo ""
echo "Add this CNAME record in your DNS provider:"
echo "Name: cellsam"
echo "Type: CNAME"
echo "Value: $CLOUDFRONT_DOMAIN"
echo "TTL: 300 (or default)"
echo ""
echo "⏰ Note: CloudFront distribution takes 10-15 minutes to deploy"
echo "🔍 Monitor status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --profile $AWS_PROFILE"