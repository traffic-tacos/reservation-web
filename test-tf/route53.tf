# Route53 Configuration for traffictacos.store

# Get existing hosted zone
data "aws_route53_zone" "traffictacos" {
  name = "traffictacos.store"
}

# Add www.traffictacos.store CNAME record pointing to CloudFront
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.traffictacos.zone_id
  name    = "www.traffictacos.store"
  type    = "CNAME"
  ttl     = "300"
  records = [aws_cloudfront_distribution.s3_distribution.domain_name]
}

# Root domain A record (optional - for direct S3 access if needed)
resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.traffictacos.zone_id
  name    = "traffictacos.store"
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
