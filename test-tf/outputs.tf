# Outputs for the static website infrastructure

output "s3_bucket_name" {
  description = "S3 bucket name for static website"
  value       = aws_s3_bucket.static_website.bucket
}

output "s3_bucket_domain" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.static_website.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.s3_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.traffictacos.zone_id
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = data.aws_route53_zone.traffictacos.name
}

output "website_urls" {
  description = "Website URLs"
  value = {
    root_domain = "https://traffictacos.store"
    www_domain  = "https://www.traffictacos.store"
  }
}
