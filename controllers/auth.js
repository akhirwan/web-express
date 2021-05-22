const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME
});

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if( !email || !password ) {
            return res.status(400).render('login', {
                message: 'Email dan password harus diisi!!'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {

            if( results ) {
                if( !(await bcrypt.compare(password, results[0].password))) {
                    res.status(400).render('login', {
                        message: 'Password salah'
                    })
                } else {
                    const id = results[0].id;
                    
                    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRES_IN
                    })

                    console.log(results[0].name + "'s token is : " + token);

                    const cookieOptions = {
                        expires: new Date(
                            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60
                        ),
                        httpOnly: true
                    }

                    res.cookie('jwt', token, cookieOptions);
                    res.status(200).redirect("/");

                    // res.status(200).render('login', {
                    //     message: 'lanjuuuutt'
                    // })
                }
            } else {
                res.status(400).render('login', {
                    message: 'Email tidak terdaftar'
                })
            }

        })

    } catch (error) {
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm} = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if(error) {
            console.log(error);
        }

        if(results.length > 0) {
            return res.render('register', {
                message: 'Alamat email sudah digunakan',
            });
        } else if(password !== passwordConfirm) {
            return res.render('register', {
                message: 'Password tidak sama',
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);

        db.query('INSERT INTO users SET ?', { 
            name: name, 
            email: email, 
            password: hashedPassword
        }, (error, results) => {
            if(error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'Registrasi berhasil',
                });
            }
        });
    })
    
}