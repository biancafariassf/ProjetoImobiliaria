const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');


app.use('/public', express.static('public'))
const serviceAccount = require('./projeto-imobiliaria.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();




app.engine("handlebars", handlebars({
    defaultLayout: "main"
}));

app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get("/", function(req, res){
    res.render("index");
});

app.post("/cadastrar", function(req, res){
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        cpf: req.body.cpf,
        email: req.body.email,
        telefone: req.body.telefone,
        dataVisita: req.body.dataVisita
    }).then(function(){
        console.log('Documento adicionado!');
        res.redirect('/');
    });
});

app.get("/consultar", function(req, res){
    const nomeBusca = req.query.nome;

    let consulta = db.collection('agendamentos');

    if (nomeBusca) {
        consulta = consulta
            .where('nome', '>=', nomeBusca)
            .where('nome', '<=', nomeBusca + '\uf8ff');
    }

    consulta.get()
        .then((snapshot) => {
            const agendamentos = [];
            snapshot.forEach((doc) => {
                agendamentos.push({
                    id: doc.id,
                    data: doc.data()
                });
            });

            const mensagem = snapshot.empty ? "Nenhum agendamento encontrado" : null;

            res.render("consultar", { agendamentos: agendamentos, mensagem: mensagem });
        })
        .catch((error) => {
            console.log("Erro ao recuperar dados:", error);
            res.status(500).send("Erro ao recuperar dados");
        });
});

app.get("/editar/:id", function(req, res){
    const agendamentoId = req.params.id;

    db.collection('agendamentos').doc(agendamentoId).get()
        .then((doc) => {
            if (!doc.exists) {
                res.status(404).send("Agendamento não encontrado");
            } else {
                res.render("atualizar", { agendamentos: { id: doc.id, data: doc.data() } });
            }
        })
        .catch((error) => {
            console.log("Erro ao recuperar agendamento:", error);
            res.status(500).send("Erro ao recuperar agendamento");
        });
});

app.post("/atualizar", function(req, res){
    const agendamentoId = req.body.id;

    const agendamentoAtualizado = {
        nome: req.body.nome,
        cpf: req.body.cpf,
        email: req.body.email,
        telefone: req.body.telefone,
        dataVisita: req.body.dataVisita
    };

    db.collection('agendamentos').doc(agendamentoId).update(agendamentoAtualizado)
        .then(() => {
            console.log('Documento atualizado com sucesso');
            res.redirect('/consultar');
        })
        .catch((error) => {
            console.log("Erro ao atualizar documento:", error);
            res.status(500).send("Erro ao atualizar documento");
    });
});

app.get("/excluir/:id", function(req, res) {
    const agendamentoId = req.params.id;

    db.collection('agendamentos').doc(agendamentoId).delete()
        .then(() => {
            console.log('Documento deletado com sucesso');
            res.redirect('/consultar');
        })
        .catch((error) => {
            console.log("Erro ao deletar documento:", error);
            res.status(500).send("Erro ao deletar documento");
        });
});

app.listen(8081, function(){
    console.log("Servidor ativo!");
});