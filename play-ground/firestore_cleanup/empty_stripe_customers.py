import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Path to your Firebase credentials file
key_path = os.environ['GOOGLE_APPLICATION_CREDENTIALS']  # path to a service-account JSON; never commit it

# Initialize the app with the service account
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

# Reference to the collection of customers
customers_ref = db.collection('customers')

# Get a reference to all customer documents
customers = customers_ref.stream()

# Iterate over the documents and delete each one
for customer in customers:
    customer.reference.delete()

print('All customer documents have been deleted.')
