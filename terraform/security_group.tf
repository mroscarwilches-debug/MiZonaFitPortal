# The old security group was destroyed on 2026-07-04, so descriptions are
# safe to define freely here (changing them later forces replacement).
resource "aws_security_group" "web_sg" {
  name_prefix = "warrior-code-"
  description = "Web portal: public HTTP/HTTPS, admin-only SSH"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.http_ingress_cidr]
  }

  ingress {
    description = "HTTPS (enable TLS on the instance before relying on it)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.http_ingress_cidr]
  }

  ingress {
    description = "SSH (admin only, never 0.0.0.0/0)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name    = "warrior-code-sg"
    Project = "WarriorCodePortal"
  }
}
