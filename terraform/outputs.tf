output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "portal_url" {
  description = "Web portal URL"
  value       = "http://${aws_instance.web.public_ip}"
}

output "ssh_command" {
  description = "SSH command for the admin"
  value       = "ssh -i <path-to-${var.key_name}.pem> ubuntu@${aws_instance.web.public_ip}"
}
