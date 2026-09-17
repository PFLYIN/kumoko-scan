-- Backup atualizado Kumoko Scan (Darkside)
-- Estrutura do Banco de Dados

CREATE DATABASE IF NOT EXISTS kumoko_scan;
USE kumoko_scan;

-- Tabela de Usuários (Agora com is_admin e total_gasto)
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `cpf` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) DEFAULT 0,
  `total_gasto` DECIMAL(10,2) DEFAULT 0.00,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- Tabela de Mangás
CREATE TABLE `mangas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `volume` INT,
  `capa_url` VARCHAR(255),
  `preco` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descricao` TEXT,
  `avaliacao` DECIMAL(2,1) DEFAULT 5.0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- Tabela de Livros
CREATE TABLE `livros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `capa_url` VARCHAR(255),
  `preco` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descricao` TEXT,
  `avaliacao` DECIMAL(2,1) DEFAULT 5.0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- Tabela de Novels
CREATE TABLE `novels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `capa_url` VARCHAR(255),
  `preco` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descricao` TEXT,
  `avaliacao` DECIMAL(2,1) DEFAULT 5.0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);

-- Tabela de Capítulos
CREATE TABLE `capitulos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `manga_id` INT NOT NULL,
  `numero` DECIMAL(5,2) NOT NULL,
  `titulo` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`manga_id`) REFERENCES `mangas` (`id`) ON DELETE CASCADE
);

-- Tabela de Páginas
CREATE TABLE `paginas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `manga_id` INT NOT NULL,
  `capitulo_id` INT NOT NULL,
  `numero_pagina` INT NOT NULL,
  `imagem_url` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`manga_id`) REFERENCES `mangas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`capitulo_id`) REFERENCES `capitulos` (`id`) ON DELETE CASCADE
);

-- Tabela de Compras (Histórico do usuário)
CREATE TABLE `compras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `produto_id` INT NOT NULL,
  `tipo_produto` VARCHAR(50) NOT NULL,
  `preco_pago` DECIMAL(10,2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
);

-- Inserindo o Admin Padrão (Senha padrão: 123456 - Hash bcrypt)
INSERT INTO `usuarios` (`nome`, `email`, `cpf`, `senha`, `is_admin`, `total_gasto`, `createdAt`, `updatedAt`) 
VALUES ('Mestre Darkside', 'admin@dark.com', '00000000000', '$2b$10$wO/9Z1tJqG./a.H6T2.k.e0V8.x8.X.e.O.k.v.T.d.u.P.a.b.M.r', 1, 0.00, NOW(), NOW());