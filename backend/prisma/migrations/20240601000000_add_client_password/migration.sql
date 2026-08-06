-- Cliente ganha senha opcional (paridade com dono)
ALTER TABLE "Client" ADD COLUMN "passwordHash" TEXT;
