module "arm-zi-is-img" {
  source   = "../kirk/docker_push"
  folder   = "./img"
  registry = "10.105.250.202:5000"
  image    = "arm-zi-is"
}
module "arm-zi-is" {
  source = "../kirk/simple"
  host   = "arm.zi.is"
  image  = module.arm-zi-is-img.image
}
