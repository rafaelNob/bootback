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

server.listen(3001, function () {
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
        .where('cCPF', id)
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
    let data_atual = new Date();
    let data_futura = new Date();
    data_futura.addMonths(parseInt(3));
    console.log("Bateuuu" + data_atual + " --- " + data_futura);


    // const { meses } = req.params;
    // data_futura.addMonths(parseInt(meses));
    let sql = `EXEC consultaDatasDisponiveis '${dateFormat(data_atual, 'yyyymmdd')}', '${dateFormat(data_futura, 'yyyymmdd')}', ?, ? `;

    knex.raw(sql, [nCdHospital, nCdEspecialidade]).then(function (dados) {
        console.log('testing1');
        if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
        res.send(dados);
        console.log('testing2');
    });
});

//TRAZER HORA MAROTA
server.get('/r/horarios/horasdisponiveis/:nCdEspecialidade/:nCdHospital/:data', (req, res, next) => {
    console.log('teste');
/*     agendarExame: "agendarExame"
codExame: 1
data: "20191023"
especialidade: undefined
hospital: "Bela Vista"
nCdHospital: 1
nCdPaciente: 1
nomeExame: "Raio X"
nomeUnidade: "Bela Vista"
ultimaData: "23/10/2019" */

/* codExame: undefined
especialidade: "Cardiologia"
hospital: "Bela Vista"
nCdEspecialidade: 31
nCdHospital: 1
nCdPaciente: 1
nomeExame: "Cardiologia"
nomeUnidade: "Bela Vista"
ultimaData: "23/10/2019"
 */
    let { nCdEspecialidade } = req.params;
    let { nCdHospital } = req.params;
    let { data } = req.params;
    let sql = `
        SELECT HORA_INICIAL = (CONVERT(VARCHAR(12),HORARIOS.dHoraInicial,108))
        ,HORARIOS.nCdHorario FROM HORARIOS WITH(NOLOCK)
                INNER JOIN MEDICO_ESPECIALIDADE ON MEDICO_ESPECIALIDADE.nCdMedico = HORARIOS.nCdMedico
            WHERE CONVERT(DATE,HORARIOS.dHoraInicial)  = CONVERT(DATE, ?)       
                AND MEDICO_ESPECIALIDADE.nCdEspecialidade = ?
                AND HORARIOS.nCdHospital = ?
                AND (
                    not EXISTS(SELECT 1 FROM CONSULTA WITH(NOLOCK) WHERE CONSULTA.nCdHorario = HORARIOS.nCdHorario)
                    and not EXISTS(SELECT 1 FROM EXAME WITH(NOLOCK) WHERE EXAME.nCdHorario = HORARIOS.nCdHorario )
                ) ORDER BY HORARIOS.dHoraInicial`;
    knex.raw(sql, [data, nCdEspecialidade, nCdHospital]).then(function (dados) {
        console.log('testing1');
        if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
        res.send(dados);
        console.log('testing2');
    });
    console.log('tested');
});

server.get('/CONSULTA', (req, res, next) => {
    console.log(req.body);

    knex.select().from('CONSULTA').then(function (CONSULTA) {
        res.send(CONSULTA);
    })
});

    server.post('/CONSULTA', function(req, res) {
        let paramCodHorario =  req.body.nCdHorario;
          let paramCodPaciente = req.body.nCdPaciente;
          let nCdEspecialidade = req.body.nCdEspecialidade;
          console.log("Entrou" + '....' + nCdEspecialidade);
            knex.raw(`exec inserirConsulta ?, ?, ? `, [paramCodHorario,paramCodPaciente,nCdEspecialidade])
              .then(function() {
                  knex.select('nCdConsulta').from('CONSULTA').where('nCdHorario', paramCodHorario).
                    then(function(CONSULTA){
                      res.send(CONSULTA);
                })
            })
     });


     /**
      * DADOS CONUSLTA EXAME 
      */

     server.get('/exame/:id', (req, res, next) => {
        let { id } = req.params;
        console.log("Id do parame " + id);
        
        id = id.replace('-', '/');
        console.log(id);
    
        knex('TIPO_EXAME')
            .where('cNmTpExame','like', "%"+id+"%")
            .first()
            .then((dados) => {
                if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
                res.send(dados);
    
            }, next);
    
    });


    server.get('/r/horarios/exame/datasdisponiveis/:nCdHospital', (req, res, next) => {
    
    const { nCdHospital } = req.params;
    let data_atual = new Date();
    let data_futura = new Date();
    data_futura.addMonths(parseInt(3));
    console.log("Bateuuu na data" + data_atual + " --- " + data_futura);
    console.log("nCdHospital ====  " +nCdHospital );
    

    // const { meses } = req.params;
    // data_futura.addMonths(parseInt(meses));
    let sql = `EXEC consultaDatasDisponiveis '${dateFormat(data_atual, 'yyyymmdd')}', '${dateFormat(data_futura, 'yyyymmdd')}', ? `;

    knex.raw(sql, [nCdHospital]).then(function (dados) {
        console.log('testing1');
        if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
        res.send(dados);
        console.log('testing2');
    });
});

server.get('/r/horarios/exame/horasdisponiveis/:nCdHospital/:data', (req, res, next) => {
    console.log('teste');

    let { codExame } = req.params;
    let { nCdHospital } = req.params;
    let { data } = req.params;

    console.log(codExame);
    console.log(nCdHospital);
    console.log(data);
    
    let sql = `
        SELECT HORA_INICIAL = (CONVERT(VARCHAR(12),HORARIOS.dHoraInicial,108))
        ,HORARIOS.nCdHorario FROM HORARIOS WITH(NOLOCK)
               
            WHERE CONVERT(DATE,HORARIOS.dHoraInicial)  = CONVERT(DATE, ?)       
               
                AND HORARIOS.nCdHospital = ?
                AND (
                    not EXISTS(SELECT 1 FROM CONSULTA WITH(NOLOCK) WHERE CONSULTA.nCdHorario = HORARIOS.nCdHorario)
                    and not EXISTS(SELECT 1 FROM EXAME WITH(NOLOCK) WHERE EXAME.nCdHorario = HORARIOS.nCdHorario )
                ) ORDER BY HORARIOS.dHoraInicial`;
    knex.raw(sql, [data, nCdHospital]).then(function (dados) {
        console.log('testing1');
        if (!dados) return res.send(new errs.BadRequestError('nada foi encontrado'))
        res.send(dados);
        console.log('testing2');
    });
    console.log('tested');
});

server.get('/exame', (req, res, next) => {
    console.log(req.body);

    knex.select().from('EXAME').then(function (EXAME) {
        res.send(EXAME);
    })
});

    server.post('/exame', function(req, res) {
        let paramCodHorario =  req.body.nCdHorario;
          let paramCodPaciente = req.body.nCdPaciente;
          let nCdExame = req.body.nCdExame;
          console.log("Entrou" + '....' + nCdExame);
            knex.raw(`exec inserirExame ?, ?, ? `, [paramCodHorario,paramCodPaciente,nCdExame])
              .then(function() {
                  knex.select('nCdExame').from('EXAME').where('nCdHorario', paramCodHorario).
                    then(function(EXAME){
                      res.send(EXAME);
                })
            })
     });