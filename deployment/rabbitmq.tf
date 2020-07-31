resource "kubernetes_namespace" "arm" {
  metadata {
    name = "arm-zi-is"
  }
}

resource "helm_release" "rabbitmq" {
  name       = "rabbitmq"
  namespace  = kubernetes_namespace.arm.metadata.0.name
  repository = "https://kubernetes-charts.storage.googleapis.com"
  chart      = "rabbitmq-ha"
  set {
    name  = "rabbitmqWebSTOMPPlugin.enabled"
    value = "true"
  }
  set {
    name  = "prometheus.operator.enabled"
    value = "false"
  }
  set {
    name  = "rabbitmqPassword"
    value = "guest"
  }
}

resource "kubernetes_ingress" "rabbitmq" {
  metadata {
    name      = "rabbitmq"
    namespace = kubernetes_namespace.arm.metadata.0.name
    annotations = {
      "kubernetes.io/ingress.class" = "nginx"
      "cert-manager.io/issuer"      = "issuer"
      "cert-manager.io/issuer-kind" = "ClusterIssuer"
    }
  }
  spec {
    tls {
      secret_name = "arm-zi-is-tls"
      hosts       = ["arm.zi.is"]
    }
    rule {
      host = "arm.zi.is"
      http {
        path {
          path = "/ws"
          backend {
            service_name = "rabbitmq-rabbitmq-ha"
            service_port = 15674
          }
        }
      }
    }
  }
}

