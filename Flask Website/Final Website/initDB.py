from main import app
from models import db, Pillows


import json

db.create_all()

with open('data.json') as f:
    data = json.load(f)
    for Pillow in data:

        case = Pillows(Name=Pillow['Name'], Price=Pillow['Price'],
                       Image=Pillow['Image'], Dimensions=Pillow['Dimensions'])
        db.session.add(case)
        db.session.commit()


print('database initialized!')

