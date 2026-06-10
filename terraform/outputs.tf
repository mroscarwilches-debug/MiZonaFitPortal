output "instancia_ip_publica" {
  description = "IP publica de la instancia EC2"
  value       = aws_instance.example.public_ip
}

output "portal_url" {
  description = "URL del portal web"
  value       = "http://${aws_instance.example.public_ip}"
}
