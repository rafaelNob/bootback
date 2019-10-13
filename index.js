const restify = require('restify');
const errs = require('restify-errors');
const cors = require('cors')

const server = restify.createServer({
    name: 'myapp',
    version: '1.0.0'
});

var knex = require('knex')({
    client: 'mssql',
    connection: {
        host: 'localhost',
        user: 'sa',
        password: '1234',
        database: 'dblucca'
    }
});
server.use(cors());
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.listen(3001, function() {
    console.log('%s listening at %s', server.name, server.url);
});

// rotas REST
server.get('/', (req, res, next) => {
    knex('paciente').then((dados) => {
        res.send(dados);
    }, next)
});

/* server.get('/r/horario', (req, res, next) => {
    knex('horarios').then((dados) => {
        res.send(dados);
    }, next)
}); */

server.get('/r/horario', (req, res, next) => {
    knex('horarios').whereBetween('dHoraInicial', ["2019-10-05","2019-12-30"]).then((dados) => {
        res.send(dados);
    }, next)  
});


server.get('/r/horario/:id', (req, res, next) => {
    const { id } = req.params;
    console.log(id);

    knex('horarios')
        .where('nCdHorario', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next)
});
server.put('/u/horario/:id', (req, res, next) => {
    console.log("AEO");
    const { id } = req.params;
    console.log("pegando o id " + id);
    console.log("body " + req.body);
    
    knex('horarios')
        .where('nCdHorario', id)
        .update(req.body)
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send('dados atualizados');
        }, next)
});

server.post('/c/paciente', (req, res, next) => {
    console.log(req.body);
    knex('paciente')
        .insert(req.body)
        .then((dados) => {
            res.send(dados);
        }, next)
});

server.get('/r/paciente/:cpf', (req, res, next) => {
    const { cpf } = req.params;
    console.log(cpf);

    knex('paciente')
        .where('nCPF', cpf)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next)
});

server.put('/u/paciente/:id', (req, res, next) => {
    const { id } = req.params;
    knex('paciente')
        .where('nCdPaciente', id)
        .update(req.body)
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send('dados atualizados');
        }, next)
});

server.del('/d/paciente/:id', (req, res, next) => {
    const { id } = req.params;
    knex('paciente')
        .where('id', id)
        .delete()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send('dados excluidos');
        }, next)
});