const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// Middleware para analisar o corpo da solicitação como JSON
app.use(express.json());

// Connection URL para o MongoDB
const url = process.env.DB_URL;
const client = new MongoClient(url);

// Nome do banco de dados
const dbName = "roque-edit";

// Usa a porta definida na variável de ambiente PORT, ou usa a porta 3000 por padrão
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor está em execução na porta ${port}`);
});
// Função assíncrona para conectar ao MongoDB e iniciar o servidor Express
async function start(app) {
  // Conecta-se ao servidor MongoDB
  await client.connect();
  console.log("Conectado com sucesso ao servidor");

  // Obtém uma referência ao banco de dados
  const db = client.db(dbName);

  // Obtém uma referência à coleção "documents" no banco de dados
  const collection = db.collection("documents");

  // Inicia o servidor Express para escutar as solicitações HTTP
  app.listen(process.env.PORT, () => {
    console.log("Servidor está em execução (Express)");
  });
}

// Endpoint para criar uma comunidade
app.post("/comunidades", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!nome || !descricao) {
      return res
        .status(400)
        .json({ mensagem: "Nome e descrição são obrigatórios" });
    }

    // Obtém uma referência à coleção "comunidades" no banco de dados
    const collection = client.db(dbName).collection("comunidades");

    // Cria um novo documento para a comunidade
    const novaComunidade = {
      nome,
      descricao,
      dataCriacao: new Date(),
    };

    // Insere a nova comunidade no banco de dados
    const resultado = await collection.insertOne(novaComunidade);
    s;

    res.status(201).json({
      mensagem: "Comunidade criada com sucesso",
      id: resultado.insertedId,
    });
  } catch (error) {
    console.error("Erro ao criar a comunidade:", error);
    res.status(500).json({ mensagem: "Erro ao criar a comunidade" });
  }
});

// Endpoint para criar um post em uma comunidade
app.post("/comunidades/:comunidadeId/posts", async (req, res) => {
  try {
    const { comunidadeId } = req.params;
    const { titulo, conteudo } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!titulo || !conteudo) {
      return res
        .status(400)
        .json({ mensagem: "Título e conteúdo são obrigatórios" });
    }

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Cria um novo documento para o post
    const novoPost = {
      comunidadeId,
      titulo,
      conteudo,
      dataCriacao: new Date(),
    };

    // Insere o novo post no banco de dados
    const resultado = await collection.insertOne(novoPost);

    res
      .status(201)
      .json({ mensagem: "Post criado com sucesso", id: resultado.insertedId });
  } catch (error) {
    console.error("Erro ao criar o post:", error);
    res.status(500).json({ mensagem: "Erro ao criar o post" });
  }
});

// Endpoint para listar os posts de uma comunidade
app.get("/comunidades/:comunidadeId/posts", async (req, res) => {
  try {
    const { comunidadeId } = req.params;

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Encontra todos os posts da comunidade especificada
    const posts = await collection.find({ comunidadeId }).toArray();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Erro ao obter os posts:", error);
    res.status(500).json({ mensagem: "Erro ao obter os posts" });
  }
});

// Endpoint para obter os comentários de um post
app.get(
  "/comunidades/:comunidadeId/posts/:postId/comentarios",
  async (req, res) => {
    try {
      const { comunidadeId, postId } = req.params;

      // Obtém uma referência à coleção "comentarios" no banco de dados
      const collection = client.db(dbName).collection("comentarios");

      // Encontra todos os comentários do post especificado
      const comentarios = await collection.find({ postId }).toArray();

      if (comentarios.length === 0) {
        comentarios.push({
          postId: postId,
          texto: "Fake post ne?",
          autor: "Not me",
          date: new Date(),
        });
      }

      res.status(200).json(comentarios);
    } catch (error) {
      console.error("Erro ao obter os comentários:", error);
      res.status(500).json({ mensagem: "Erro ao obter os comentários" });
    }
  }
);

// Endpoint para editar um post
app.put("/comunidades/:comunidadeId/posts/:postId", async (req, res) => {
  try {
    const { comunidadeId, postId } = req.params;
    const { titulo, conteudo } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!titulo || !conteudo) {
      return res
        .status(400)
        .json({ mensagem: "Título e conteúdo são obrigatórios" });
    }

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Atualiza o post no banco de dados
    const resultado = await collection.updateOne(
      { _id: postId, comunidadeId },
      { $set: { titulo, conteudo } }
    );

    if (resultado.modifiedCount === 0) {
      return res.status(404).json({ mensagem: "Post não encontrado" });
    }

    res.status(200).json({ mensagem: "Post editado com sucesso" });
  } catch (error) {
    console.error("Erro ao editar o post:", error);
    res.status(500).json({ mensagem: "Erro ao editar o post" });
  }
});
// fim dos endpoints

// Inicia a rotina de inicialização
start(app)
  .then(() => console.log("Rotina de inicialização concluída"))
  .catch((err) => console.log("Erro na rotina de inicialização: ", err));
