// 1 - Invocamos a Express
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const moment = require('moment')
var fs = require('fs');



//2 - Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({extended:false}));
app.use(express.json());//además le decimos a express que vamos a usar json
app.use(cookieParser());
//app.use(express.cookieParser());


//3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env'});

//4 -seteamos el directorio de assets
app.use(express.static('public'));
app.use('/resources',express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//5 - Establecemos el motor de plantillas
app.set('view engine','ejs');

//6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

//7- variables de session
const session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
	httpOnly: false,
	secure: false
}));


// 8 - Invocamos a la conexion de la DB
const connection = require('./database/db');
const { getQueriesByusername } = require('./database/helpers.js');


initial_query = "CREATE DATABASE IF NOT EXISTS seguridad_apps_web"
create_table_users = "CREATE TABLE IF NOT EXISTS users (user varchar(20), name varchar(100), rol varchar(50), hashed_pwd varchar(255));"
create_table_queries = "CREATE TABLE IF NOT EXISTS queries (assigned_user varchar(20), query varchar(255));"


connection.query(initial_query);
connection.query(create_table_users);
connection.query(create_table_queries);

bcrypt.hash("supporter123", 8).then(result => {
	connection.query('INSERT INTO users SET ?',{user:"supporter", name:"supporter", rol:"supporter", hashed_pwd:result})
}).catch(error => {
	console.log("Supporter exists.")
});

const hasRole = (roles) => {
	return function(req, res, next) {
		const token = req.cookies.access_token;
		if (!token) {
			return res.sendStatus(403);
		}
		try {
			const data = jwt.verify(token, "secret");
			req.userRole = data.role;
			
			if (roles.includes(req.userRole)) {
				return next();	
			}
			return res.sendStatus(403);

		  } catch {
			return res.sendStatus(403);
		  }
	}
  }

app.get('/', async (req, res)=> {
	const token = req.cookies.access_token;
	if (!token) {
		res.render('make_query');
	} else {
		const data = jwt.verify(token, "secret");
		role = data.role;
		if (role == "supporter") {
		const queries = await getQueriesByusername("supporter");
		const queriesList = queries.map(query => 
			`<li>${query.query}</li>`
		);
		res.send(`
		<!doctype html>
			<html lang="en">
				<head>
					<!-- Required meta tags -->
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<link rel="stylesheet" href="resources/css/style.css">
					<title>Welcome</title>
					<style>      
					
					</style>
				</head>
				<body class="text-center">         
					<div class="contenedor">
						<h1>Página de Inicio</h1>
						${queriesList}
					</div>
				</body>
			</html>
		`)
		} else {
			if (role == "engineer") {
				res.render('iac',{
					iac_code: ""
				});
			} else {
				res.render('make_query');	
			}
		}
	}
	//res.end();
});

//9 - establecemos las rutas
	app.get('/login',(req, res)=>{
		res.render('login');
	})

	app.get('/createUsers', hasRole(['supporter', 'engineer']), (req, res)=>{
		res.render('register');
	})

//Bloquear este metodo solo para Supporters e Engineers
app.post('/createUsers', hasRole(['supporter', 'engineer']), async (req, res)=>{
	const user = req.body.user;
	const name = req.body.name;
    const rol = req.body.rol;
	const pass = req.body.pass;
	let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{user:user, name:name, rol:rol, hashed_pwd:passwordHash}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Creacion de usuario",
				alertMessage: "Se creo el usuario exitosamente!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
            res.redirect('/');         
        }
	});
})


app.post('/createQuery', async (req, res)=>{
	const query = req.body.query;
	const assigned_user = "supporter";
    connection.query('INSERT INTO queries SET ?', {assigned_user:assigned_user, query:query}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{
			res.render('alert_msg', {
				alert: true,
				alertTitle: "Consulta",
				alertMessage: "Se envio la consulta exitosamente!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});         
        }
	});
})


//11 - Metodo para la autenticacion
app.post('/auth', async (req, res)=> {
	const user = req.body.user;
	const pass = req.body.pass;    
    let passwordHash = await bcrypt.hash(pass, 8);
	if (user && pass) {
		connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results, fields)=> {
			if( results.length == 0 || !(await bcrypt.compare(pass, results[0].hashed_pwd)) ) {    
				res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "USUARIO y/o PASSWORD incorrectas",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'    
                    });
				
				//Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');				
			} else {         
				const _role = results[0].rol
				const token = jwt.sign({
					role: _role
				}, 'secret', { expiresIn: 60 * 60 });
				
				res.cookie("access_token", token, {
					httpOnly: false,
					secure: false,
				})
				
				req.session.loggedin = true;                
				req.session.name = results[0].name;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: ''
				});        			
			}			
			res.end();
		});
	} else {	
		res.send('Please enter user and Password!');
		res.end();
	}
});

//12 - Método para controlar que está auth en todas las páginas
app.get('/login', (req, res)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('index',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
	res.end();
});


//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.clearCookie("access_token");
	  res.redirect('/login'); // siempre se ejecutará después de que se destruya la sesión
	})
});

app.get('/create_infrastructure', hasRole(['engineer']), (req, res)=> {
	res.render('iac',{
		iac_code: ""
	});
});

app.get('/iac_template', hasRole(['engineer']), (req, res)=> {
	let iac_template_filename = "";
	if (!req.query.filename){
		iac_template_filename = "./iac_template.txt"
	} else {
		iac_template_filename = req.query.filename
	}


	fs.readFile(iac_template_filename, 'utf8', function (err, data) {
		if (err) {
			console.error(err);
			res.render('iac',{
				iac_code: ""
			});
		}
		console.log(data)
		res.render('iac',{
			iac_code: data	
		});
	  });
});

app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
});