import json
from urllib import response
from flask import Flask, request, render_template, redirect, flash, url_for, jsonify,Blueprint
from flask_jwt import JWT, jwt_required, current_identity
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from models import db, Pillows, Comments
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm 
from wtforms.validators import InputRequired, Email, Length
from wtforms import StringField, PasswordField, BooleanField
from flask_bootstrap import Bootstrap
from werkzeug.security import generate_password_hash, check_password_hash


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sqlite.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    app.config['SECRET_KEY'] = "MYSECRET"
    app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=7)
    db.init_app(app)
    return app



app = create_app()
app.app_context().push()
bootstrap = Bootstrap(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# db.create_all(app=app)


class User(UserMixin, db.Model): #User Mixin is what flask uses to inject extra stuff into the Model
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(15), unique=True)
    email = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(80))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class LoginForm(FlaskForm):
    username = StringField('username', validators=[InputRequired(), Length(min=4, max=15)])
    password = PasswordField('password', validators=[InputRequired(), Length(min=8, max=80)])
    remember = BooleanField('remember me')

class RegisterForm(FlaskForm):
    email = StringField('email', validators=[InputRequired(), Email(message='Invalid email'), Length(max=50)])
    username = StringField('username', validators=[InputRequired(), Length(min=4, max=15)])
    password = PasswordField('password', validators=[InputRequired(), Length(min=8, max=80)])


@app.route('/', methods=['GET','POST'])#make sure the href matches with this route
#@jwt_required()
def main():
    pillowDatabase = Pillows.query.all()    
    commentDatabase = Comments.query.all()
    itemName = request.form.get("Item_Name")
    return render_template('index.html', Allpillows = pillowDatabase,Allcomments = commentDatabase, name=itemName  ) #can only use this with render



@app.route('/post', methods=['GET','POST'])
def create_post():
    Data = request.form.get('postest')
    #print("Creating database test = ",type(Data))
    searchoutput = Comments(text=Data) #pushing data grabbed from textbox into database
    db.session.add(searchoutput)
    db.session.commit()
    return main()    
    #return 'Post Created', 201

@app.route("/delete-comment/<comment_id>")
#@login_required
def delete_comment(comment_id):
    print ("Lets see what we have here: ",comment_id)
    comment = Comments.query.filter_by(id=comment_id).first()
    db.session.delete(comment)
    db.session.commit()
    return "Post Deleted", 204

@app.route('/posts', methods=['GET'])
#@jwt_required()
def view_posts():
    posts = Comments.query.all() 
    arr = []
    for post in posts:
       arr.append(post.text)    
    return json.dumps(arr),200 #to view on separate page in json form


    
@app.route('/searchresults', methods=['GET','POST'])#make sure the href matches with this route
#@jwt_required()
def RetrieveSearch():
    commentDatabase = Comments.query.all()
    Data = request.args.get('query')#matches the name variable in the index.html       
    #print("This search test = ",Data)

    if Data: #if data exist
        posts = Pillows.query.filter(Pillows.Name.contains(Data))
    else:
        posts = Pillows.query.all() #posts = Pillows.query.limit(3).all() for first 3 data
    
    return render_template('index.html', Allpillows = posts, Allcomments = commentDatabase)           
    
    #return jsonify(select)

@app.route("/test", methods=["GET", "POST"])
def filter():
    commentDatabase = Comments.query.all()
    sort = request.form.get("sort")
    alpha_count,price_count = 1,1      

    print("This test option selected = ",sort)

    if sort=="Alphabically(Z-A)":
        posts = Pillows.query.order_by(Pillows.Name.desc()).all()

    if sort=="Alphabically(A-Z)":
        posts = Pillows.query.order_by(Pillows.Name.asc()).all()
            
    if sort=="HighestPrice":
        posts = Pillows.query.order_by(Pillows.Price.desc()).all()            
    if sort=="LowestPrice":
        posts = Pillows.query.order_by(Pillows.Price.asc()).all()
            
    return render_template("index.html", Allpillows = posts, Allcomments = commentDatabase)

@app.route('/Signup', methods=['GET', 'POST']) 
def Signup():
    form = RegisterForm() #this is needed if the webpage uses forms

    if form.validate_on_submit(): #checks to see if the form was submitted
        hashed_password = generate_password_hash(form.password.data, method='sha256') #This hashes the password so its not in plain text
        new_user = User(username=form.username.data, email=form.email.data, password=hashed_password) #creates new users by passing and saving the user data entered to the User models 
        db.session.add(new_user) #adds user to database
        db.session.commit()

        #return '<h1>New user has been created!</h1>'
        return (redirect(url_for('Login')),'<h1>New user has been created!</h1>')
        #return '<h1>' + form.username.data + ' ' + form.email.data + ' ' + form.password.data + '</h1>'
        #This return statement tests to see if the data got captured
    return render_template('Signup.html', form=form)

@app.route('/Login', methods=['GET', 'POST']) 
def Login():
    form = LoginForm() #this is needed if the webpage uses forms
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first() #filters the database to check for the first match(only match since user names are unique)
        if user: #if user exist
            if check_password_hash(user.password, form.password.data): #checks to see if password entered in the form matches the database password
                login_user(user, remember=form.remember.data) #remembers the login
            return redirect(url_for('contactPage')) #this must be the name of the function that takes you back to the default page/whatever page

        return '<h1>Invalid username or password</h1>'
        return '<h1>' + form.username.data + ' ' + form.password.data + '</h1>'   

    return render_template('Login.html', form=form)



@app.route('/Contact')
#@login_required
def contactPage():
    return render_template('Contact.html',name=current_user.username)



@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
