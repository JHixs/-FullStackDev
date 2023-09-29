from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
db = SQLAlchemy()

class Pillows(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(80), unique=True, nullable=False)
    Price = db.Column(db.Integer)
    Image = db.Column(db.String(200),nullable = False)
    Dimensions  = db.Column(db.String(120), nullable=False)

    def toDict(self):
        return{
            'id':self.id,
            'Name':self.Name,
            'Price':self.Price,
            'Image':self.Image,
            'Dimensions':self.Dimensions
        }

class Comments(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(80), unique=False, nullable=False)
    
    def toDict(self):
        return{
            'id':self.id,
            'text':self.text,           
        }
