import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use the application default credentials
key_path = 'play_ground/firestore_cleanup/firebay-6554f-firebase-adminsdk-9ov3f-6d4475685b.json'  # replace with the path to your JSON file

# Initialize the app with the service account
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

# Reference to the collection of customers
customers_ref = db.collection('customers')

# Now we iterate over all customers
for customer in customers_ref.stream():
    
    # Define the subcollections you want to clear
    subcollections = ['checkout_sessions', 'payments', 'subscriptions']

    # Iterate over each subcollection
    for subcollection in subcollections:
        # Reference to the subcollection for each customer
        subcollection_ref = customers_ref.document(customer.id).collection(subcollection)
        
        # Retrieve all documents in the subcollection
        for doc in subcollection_ref.stream():
            # Delete each document
            doc.reference.delete()
        print(f'All documents in {subcollection} have been deleted for customer {customer.id}.')

print('All specified subcollections have been deleted for all customers.')
