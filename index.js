const dateFormat = require('dateformat');
const restify = require('restify');
const errs = require('restify-errors');

const server = restify.createServer({
    name: 'myapp',
    version: '1.0.0'
});

let knex = require('knex')({
    client: 'mssql',
    connection: {
        host: 'localhost',
        user: 'sa',
        password: '1234',
        database: 'dbLucca',
        port: 1433
    }
});

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

server.get('/especialidade/:id', (req, res, next) => {
    let { id } = req.params;
    id = id.replace('-', '/');
console.log(id);

    knex('especialidade')
        .where('cNmEspecialidade', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);

        }, next);

});

server.get('/horarios/:id', (req, res, next) => {

    const { id } = req.params;

    knex('HORARIOS')
        .where('nCdHorario', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);

        }, next);

});

server.get('/r/datas/desabilitadas/:meses', (req, res, next) => {
    console.log("caiuss");
    const { meses } = req.params;
    let data_atual = new Date();
    let data_futura = new Date();
    data_futura.addMonths(parseInt(meses));

    console.log(dateFormat(data_atual, 'yyyy-mm-dd'));
    console.log(dateFormat(data_futura, 'yyyy-mm-dd'));

    knex('HORARIOS').whereBetween('dHoraInicial', [dateFormat(data_atual, 'yyyy-mm-dd'), dateFormat(data_futura, 'yyyy-mm-dd')])
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next);
});
 
server.get('/tipoConsulta/:id', (req, res, next) => {
    const { id } = req.params;

    knex('TIPO_CONSULTA')
        .where('nCdTpConsulta', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next);
});



server.get('/hospital/:id', (req, res, next) => {

    const { id } = req.params;

    knex('hospital')
        .where('cNmHospital', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);

        }, next);

});


server.post('/create', (req, res, next) => {
    console.log(req.body);

    knex('paciente')
        .insert(req.body)
        .then((dados) => {
            res.send(dados);
          }, next)
});

server.get('/paciente/:id', (req, res, next) => {
    const { id } = req.params;
    console.log(id);

    knex('paciente')
        .where('nCPF', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next)
});

server.put('/update/:id', (req, res, next) => {
    const { id } = req.params;

    knex('paciente')
        .where('id', id)
        .update(req.body)
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send('dados atualizados');
        }, next)
});

server.del('/delete/:id', (req, res, next) => {

    const { id } = req.params;

    knex('paciente')
        .where('id', id)
        .delete()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send('dados excluidos');
        }, next)

});


//TRAZER DATA MAROTA
server.get('/r/horarios/datasdisponiveis/:nCdEspecialidade/:nCdHospital', (req, res, next) => {
    const { nCdEspecialidade } = req.params;
    const { nCdHospital } = req.params;
    console.log(nCdEspecialidade);
    console.log(nCdHospital);
    console.log("caiuu");
    let data_atual = new Date();
    let data_futura = new Date();
    data_futura.addMonths(parseInt(3));
    // const { meses } = req.params;
    // data_futura.addMonths(parseInt(meses));

    knex.from('HORARIOS').leftJoin('CONSULTA', 'HORARIOS.nCdHorario', 'CONSULTA.nCdHorario')
    .leftJoin('HOSPITAL_ESPECIALIDADE', 'HORARIOS.nCdHospital', 'HOSPITAL_ESPECIALIDADE.nCdHospital')
    .whereBetween('HORARIOS.dHoraInicial', [dateFormat(data_atual, 'yyyy-mm-dd'),dateFormat(data_futura, 'yyyy-mm-dd')])
    .where({'HOSPITAL_ESPECIALIDADE.nCdEspecialidade':nCdEspecialidade, 'HORARIOS.nCdHospital':nCdHospital})
    .whereNull('CONSULTA.nCdConsulta')
    .distinct('HORARIOS.cDATAFORMATADA')
    .then((dados) => {
            if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
            res.send(dados);
        }, next)
});
//knex.from('HORARIOS').innerJoin('CONSULTA', 'HORARIOS.nCdHorario', 'CONSULTA.nCdHorario')
//TRAZER HORA MAROTA


server.get('/r/horarios/horasdisponiveis/:nCdEspecialidade/:nCdHospital/:data', (req, res, next) => {
    console.log('teste');
    
    const { nCdEspecialidade } = req.params;
    const { nCdHospital } = req.params;
    let { data } = req.params;
    let sql = `
        SELECT HORA_INICIAL = (CONVERT(VARCHAR(12),HORARIOS.dHoraInicial,108))
            FROM HORARIOS WITH(NOLOCK)
                INNER JOIN MEDICO_ESPECIALIDADE ON MEDICO_ESPECIALIDADE.nCdMedico = HORARIOS.nCdMedico
            WHERE CONVERT(DATE,HORARIOS.dHoraInicial)  = CONVERT(DATE, ?)       
                AND MEDICO_ESPECIALIDADE.nCdEspecialidade = ?
                AND HORARIOS.nCdMedico = ?
                AND (
                    EXISTS(SELECT 1 FROM CONSULTA WITH(NOLOCK) WHERE CONSULTA.nCdHorario = HORARIOS.nCdHorario)
                    OR EXISTS(SELECT 1 FROM EXAME WITH(NOLOCK) WHERE EXAME.nCdHorario = HORARIOS.nCdHorario )
                )`;
    knex.raw(sql, [data, nCdEspecialidade, nCdHospital]).then(function(dados) {
        console.log('testing1');
        if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
        res.send(dados);
        console.log('testing2');
    });
    console.log('tested');
});