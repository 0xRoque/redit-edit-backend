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

// name do banco de dados
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
    const { name, description } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "name e descrição são obrigatórios" });
    }

    // Obtém uma referência à coleção "comunidades" no banco de dados
    const collection = client.db(dbName).collection("comunidades");

    // Cria um novo documento para a comunidade
    const novaComunidade = {
      name,
      description,
      creationDate: new Date(),
    };

    // Insere a nova comunidade no banco de dados
    const result = await collection.insertOne(novaComunidade);
    s;

    res.status(201).json({
      message: "Comunidade criada com sucesso",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Erro ao criar a comunidade:", error);
    res.status(500).json({ message: "Erro ao criar a comunidade" });
  }
});

// Endpoint para criar um post em uma comunidade
app.post("/comunidades/:communityId/posts", async (req, res) => {
  try {
    const { communityId } = req.params;
    const { title, content } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Título e conteúdo são obrigatórios" });
    }

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Cria um novo documento para o post
    const newPost = {
      communityId,
      title,
      content,
      creationDate: new Date(),
    };

    // Insere o novo post no banco de dados
    const result = await collection.insertOne(newPost);

    res
      .status(201)
      .json({ message: "Post criado com sucesso", id: result.insertedId });
  } catch (error) {
    console.error("Erro ao criar o post:", error);
    res.status(500).json({ message: "Erro ao criar o post" });
  }
});

// Endpoint para listar os posts de uma comunidade
app.get("/comunidades/:communityId/posts", async (req, res) => {
  try {
    const { communityId } = req.params;

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Encontra todos os posts da comunidade especificada
    const posts = await collection.find({ communityId }).toArray();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Erro ao obter os posts:", error);
    res.status(500).json({ message: "Erro ao obter os posts" });
  }
});

// Endpoint para obter os comentários de um post
app.get(
  "/comunidades/:communityId/posts/:postId/comments",
  async (req, res) => {
    try {
      const { communityId, postId } = req.params;

      // Obtém uma referência à coleção "comments" no banco de dados
      const collection = client.db(dbName).collection("comments");

      // Encontra todos os comentários do post especificado
      const comments = await collection.find({ postId }).toArray();

      if (comments.length === 0) {
        comments.push({
          postId: postId,
          texto: "Fake post?",
          autor: "Not me",
          date: new Date(),
        });
      }

      res.status(200).json(comments);
    } catch (error) {
      console.error("Erro ao obter os comentários:", error);
      res.status(500).json({ message: "Erro ao obter os comentários" });
    }
  }
);

// Endpoint para editar um post
app.put("/comunidades/:communityId/posts/:postId", async (req, res) => {
  try {
    const { communityId, postId } = req.params;
    const { title, content } = req.body;

    // Verifica se todos os campos necessários foram fornecidos
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Título e conteúdo são obrigatórios" });
    }

    // Obtém uma referência à coleção "posts" no banco de dados
    const collection = client.db(dbName).collection("posts");

    // Atualiza o post no banco de dados
    const result = await collection.updateOne(
      { _id: postId, communityId },
      { $set: { title, content } } //
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Post não encontrado" });
    }

    res.status(200).json({ message: "Post editado com sucesso" });
  } catch (error) {
    console.error("Erro ao editar o post:", error);
    res.status(500).json({ message: "Erro ao editar o post" });
  }
});
// fim dos endpoints

// Inicia a rotina de inicialização
start(app)
  .then(() => console.log("Rotina de inicialização concluída"))
  .catch((err) => console.log("Erro na rotina de inicialização: ", err));
