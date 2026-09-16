terraform {
  required_version = ">= 1.5.0"

  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "null" {}

resource "null_resource" "kind_cluster" {

  provisioner "local-exec" {

    command = "kind create cluster --name unit-converter --config ${path.module}/kind-config.yaml --wait 5m"

  }

  provisioner "local-exec" {

    when = destroy

    command = "kind delete cluster --name unit-converter"

  }
}
