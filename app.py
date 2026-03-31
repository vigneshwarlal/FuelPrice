import pandas as pd
from flask import Flask, request, render_template
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LinearRegression
import pickle

app = Flask(__name__)

# =========================
# LOAD DATA
# =========================
df = pd.read_csv("diesel.csv")

# Convert date to datetime
df['date'] = pd.to_datetime(df['date'])

# Extract year
df['year'] = df['date'].dt.year

# Drop unnecessary columns
df = df[['city', 'year', 'rate']]

# =========================
# ENCODING
# =========================
le = LabelEncoder()
df['city'] = le.fit_transform(df['city'])

# =========================
# FEATURES & TARGET
# =========================
X = df[['city', 'year']]
y = df['rate']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# =========================
# MODEL TRAINING
# =========================
model = LinearRegression()
model.fit(X_train, y_train)

# Save model
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(le, open("encoder.pkl", "wb"))

# =========================
# FLASK ROUTES
# =========================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    city = request.form['city']
    year = int(request.form['year'])

    # Load encoder & model
    model = pickle.load(open("model.pkl", "rb"))
    le = pickle.load(open("encoder.pkl", "rb"))

    # Encode city
    city_encoded = le.transform([city])[0]

    # Predict
    prediction = model.predict([[city_encoded, year]])

    return render_template('index.html', prediction_text=f"Predicted Fuel Price: {prediction[0]:.2f}")

if __name__ == "__main__":
    app.run(debug=True)