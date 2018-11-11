var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var sql = require('mssql');
var env = require('dotenv');

var app = express();
app.use(cors());
app.use(bodyParser());

const result = env.config();
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    debug: true,
    options: {
        encrypt: false
    }
};

app.use(function(err, req, res, next){
    console.error(err);
    res.send({ success: false, message: err })
});

app.listen(Number(process.env.APP_PORT), function(){
    console.log("El servidor esta corriendo");
    console.log(result.parsed);
    console.log(sqlConfig);
});


//Los Maestros pueden ver los alumnos que pertenecen a una clase en particular.
app.get('/v1/students/class', function(req, res, next){
    
    var classCode = req.query.ccode;
    
    if(!classcode){
        res.send("Ocurrio un error, favor verificar todos los parámetros requeridos.");
    }

    sql.connect(sqlConfig).then(() => {
        return sql.query(`SELECT Enrollment.StudentCode, Students.StudentName FROM Enrollment RIGHT JOIN Students ON Enrollment.StudentCode = Students.StudentCode WHERE Enrollment.ClassCode = '${classCode}';`)
    }).then(result => {
        var data= {
            success: true,
            message: '',
            data: result.recordset
        }
        res.send(data);

        sql.close();
    }).catch(err => {
        return next(err);
    });
});


// Los estudiantes puden marcar sus asistencia por dia y clase.
// Los Maestros pueden marcar asistencia de cada clase.
app.post('/v1/attendance/new', (req, res) => {
    let studentcode = req.body.scode;
    let classcode = req.body.ccode;
    let date = new Date();

    sql.connect(sqlConfig).then(() => {
        var q = sql.query(`Select [EnrollmentID] from dbo.Enrollment where ([StudentCode] = '${studentcode}') and ([ClassCode] = '${classcode}');`)
    });
    
    if(q === ''){
        res.send("Ocurrio un error, verifique que el alumno este matriculado en esta clase");
    }

    else{

        sql.connect(sqlConfig).then(() => {
            var q = `insert into dbo.Attendance([StudentCode], [ClassCode], [AttendanceDate]) values('${studentcode}', '${classcode}', '${date}')`;
            console.log(q);
            return sql.query(q)
        }).then(result => {
            var data = {
                success: true,
                message: `Se ha creado ${result.rowsAffected} registro nuevo`
        }
    
            res.send(data);
    
            sql.close();
        }).catch(err => {
            return next(err);
        });
    }
});



