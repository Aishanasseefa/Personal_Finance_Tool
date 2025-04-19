#flask code
from flask import Flask,render_template,request,url_for,redirect,flash,jsonify,session,render_template_string
from config import Database 
from flask_cors import CORS
from datetime import datetime
import numpy as np
from sklearn.linear_model import LinearRegression



app = Flask(__name__)

CORS(app)

app.secret_key='1234'

db = Database()



@app.route('/')
def index():
    return render_template("login.html")

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    user = db.fetchone("SELECT * FROM tbl_login WHERE username='{}' AND password='{}'".format(username, password))

    if user:
        if user['role'] == 'admin':
            session["admin"]=True
            return redirect(url_for("home"))
        else:
            flash('Invalid usertype', 'error')
            return redirect(url_for("index"))
    else:
        flash('Invalid username or password', 'error')
        return redirect(url_for("index"))
    
@app.route('/logout')
def logout():
    session.pop('admin', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

    

@app.route('/home')
def home():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    
    # Total Users
    total_users = db.fetchone("SELECT COUNT(*) as count FROM tbl_user")['count']
    active_users = db.fetchone(
        "SELECT COUNT(DISTINCT login_id) as count FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE())"
    )['count']
    total_users_progress = min(total_users * 10, 100)
    print(f"Total Users: {total_users}, Active Users: {active_users}, Progress: {total_users_progress}")
    
    # Total Expenses (Current Month vs Last Month)
    total_expenses = db.fetchone(
        "SELECT SUM(amount) as total FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())"
    )['total'] or 0
    last_month_expenses = db.fetchone(
        "SELECT SUM(amount) as total FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(date) = YEAR(CURDATE())"
    )['total'] or 0
    expense_growth_rate = ((total_expenses - last_month_expenses) / last_month_expenses * 100) if last_month_expenses > 0 else 0
    expense_progress = min(total_expenses / 1000, 100)
    print(f"Total Expenses: {total_expenses}, Last Month: {last_month_expenses}, Growth Rate: {expense_growth_rate}, Progress: {expense_progress}")
    
    # Average Savings Rate
    savings_data = db.fetchone(
        "SELECT AVG((u.salary + COALESCE(ai.total_income, 0) - COALESCE(e.total_expense, 0)) / NULLIF(u.salary + COALESCE(ai.total_income, 0), 0)) * 100 as rate "
        "FROM tbl_user u "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_income FROM tbl_add_income WHERE MONTH(month) = MONTH(CURDATE()) GROUP BY login_id) ai ON u.login_id = ai.login_id "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_expense FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id) e ON u.login_id = e.login_id"
    )
    avg_savings_rate = savings_data['rate'] or 0
    print(f"Average Savings Rate: {avg_savings_rate}")
    
    # Budget Adherence Rate
    adherence_data = db.fetchone(
        "SELECT (SUM(CASE WHEN e.total_amount <= s.suggested_amount THEN 1 ELSE 0 END) / COUNT(*)) * 100 as rate "
        "FROM tbl_suggestions s "
        "LEFT JOIN (SELECT login_id, category_id, SUM(amount) as total_amount FROM tbl_expense "
        "WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id, category_id) e "
        "ON s.login_id = e.login_id AND s.category_id = e.category_id "
        "WHERE s.month = '{}' AND s.year = {}".format(datetime.now().strftime('%B'), datetime.now().year)
    )
    budget_adherence_rate = adherence_data['rate'] or 0
    print(f"Budget Adherence Rate: {budget_adherence_rate}")
    
    # Highest Spending Category
    highest_spending_category = db.fetchone(
        "SELECT c.category_name, SUM(e.amount) as total FROM tbl_expense e "
        "JOIN tbl_category c ON e.category_id = c.id WHERE MONTH(e.date) = MONTH(CURDATE()) "
        "GROUP BY c.id, c.category_name ORDER BY total DESC LIMIT 1"
    )
    highest_category_name = highest_spending_category['category_name'] if highest_spending_category else "N/A"
    highest_category_amount = float(highest_spending_category['total'] or 0) if highest_spending_category else 0
    print(f"Highest Spending Category: {highest_category_name}, Amount: {highest_category_amount}")
    
    # Most Active User (by number of transactions)
    most_active_user = db.fetchone(
        "SELECT l.username, COUNT(e.id) as transaction_count FROM tbl_expense e "
        "JOIN tbl_login l ON e.login_id = l.id WHERE MONTH(e.date) = MONTH(CURDATE()) "
        "GROUP BY e.login_id, l.username ORDER BY transaction_count DESC LIMIT 1"
    )
    most_active_username = most_active_user['username'] if most_active_user else "N/A"
    most_active_transactions = most_active_user['transaction_count'] if most_active_user else 0
    print(f"Most Active User: {most_active_username}, Transactions: {most_active_transactions}")
    
    # New Card: Expense Distribution by Source
    expense_by_source = db.fetchall(
        "SELECT source, SUM(amount) as total FROM tbl_expense "
        "WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY source"
    )
    expense_by_source_labels = [row['source'] for row in expense_by_source]
    expense_by_source_values = [float(row['total'] or 0) for row in expense_by_source]
    print(f"Expense by Source: {expense_by_source_labels}, {expense_by_source_values}")
    
    # Trend Data (Last 6 Months)
    trend_data = db.fetchall(
        "SELECT MONTHNAME(date) as month, SUM(amount) as total FROM tbl_expense "
        "WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) "
        "GROUP BY MONTH(date), MONTHNAME(date) ORDER BY MIN(date)"
    )
    trend_labels = [row['month'] for row in trend_data]
    trend_values = [float(row['total'] or 0) for row in trend_data]
    print(f"Trend Data: {trend_labels}, {trend_values}")
    
    # Category Data (Top 5)
    category_data = db.fetchall(
        "SELECT c.category_name, SUM(e.amount) as total FROM tbl_expense e "
        "JOIN tbl_category c ON e.category_id = c.id WHERE MONTH(e.date) = MONTH(CURDATE()) "
        "GROUP BY c.id, c.category_name ORDER BY total DESC LIMIT 5"
    )
    category_labels = [row['category_name'] for row in category_data]
    category_values = [float(row['total'] or 0) for row in category_data]
    print(f"Category Data: {category_labels}, {category_values}")
    
    # Top Spending Users (Top 5)
    top_users_data = db.fetchall(
        "SELECT l.username, SUM(e.amount) as total FROM tbl_expense e "
        "JOIN tbl_login l ON e.login_id = l.id "
        "WHERE MONTH(e.date) = MONTH(CURDATE()) GROUP BY e.login_id, l.username ORDER BY total DESC LIMIT 5"
    )
    top_users_labels = [row['username'] for row in top_users_data]
    top_users_values = [float(row['total'] or 0) for row in top_users_data]
    print(f"Top Users Data: {top_users_labels}, {top_users_values}")
    
    # Savings vs Expenses
    savings_vs_expenses = db.fetchone(
        "SELECT SUM(u.salary + COALESCE(ai.total_income, 0) - COALESCE(e.total_expense, 0)) as savings, "
        "SUM(COALESCE(e.total_expense, 0)) as expenses "
        "FROM tbl_user u "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_income FROM tbl_add_income WHERE MONTH(month) = MONTH(CURDATE()) GROUP BY login_id) ai ON u.login_id = ai.login_id "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_expense FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id) e ON u.login_id = e.login_id"
    )
    savings_value = float(savings_vs_expenses['savings'] or 0)
    expenses_value = float(savings_vs_expenses['expenses'] or 0)
    print(f"Savings vs Expenses: Savings={savings_value}, Expenses={expenses_value}")

    return render_template("home.html", 
        total_users=total_users, active_users=active_users, total_users_progress=total_users_progress,
        total_expenses=total_expenses, expense_growth_rate=expense_growth_rate, expense_progress=expense_progress,
        avg_savings_rate=avg_savings_rate,
        budget_adherence_rate=budget_adherence_rate,
        highest_category_name=highest_category_name, highest_category_amount=highest_category_amount,
        most_active_username=most_active_username, most_active_transactions=most_active_transactions,
        expense_by_source_labels=expense_by_source_labels, expense_by_source_values=expense_by_source_values,
        trend_labels=trend_labels, trend_data=trend_values,
        category_labels=category_labels, category_data=category_values,
        top_users_labels=top_users_labels, top_users_data=top_users_values,
        savings_value=savings_value, expenses_value=expenses_value
    )


@app.route('/category', methods=['GET', 'POST'])
def category():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    if request.method == 'POST':
        action = request.form.get('action')
        category_name = request.form['category_name']
        
        if action == 'add':
            category = db.fetchone("SELECT * FROM tbl_category WHERE category_name='{}'".format(category_name))
            if category:
                flash('Category already exists', 'error')
            else:
                db.execute("INSERT INTO tbl_category (category_name) VALUES ('{}')".format(category_name))
                flash('Category added successfully', 'success')
        
        elif action == 'update':
            category_id = request.form['category_id']
            db.execute("UPDATE tbl_category SET category_name='{}' WHERE id={}".format(category_name, category_id))
            flash('Category updated successfully', 'success')
        
        return redirect(url_for('category'))
    
    categories = db.fetchall("SELECT * FROM tbl_category")
    return render_template("category.html", categories=categories)

@app.route('/user')
def user():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    users = db.fetchall(
        "SELECT u.*, l.username FROM tbl_login l INNER JOIN tbl_user u ON u.login_id = l.id WHERE l.role = 'user'"
    )
    return render_template("user.html", users=users)

@app.route('/insights/users')
def insights_users():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    
    # Active Users (e.g., users with expenses this month)
    active_users = db.fetchone(
        "SELECT COUNT(DISTINCT login_id) as count FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE())"
    )['count']
    
    # Average Expenses per User
    avg_expenses = db.fetchone(
        "SELECT AVG(total_expense) as avg FROM ("
        "SELECT login_id, SUM(amount) as total_expense FROM tbl_expense "
        "WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id) e"
    )
    avg_expenses_per_user = avg_expenses['avg'] or 0
    
    # User Activity Data
    users = db.fetchall(
        "SELECT u.login_id, l.username, u.name, "
        "COALESCE(e.total_expense, 0) as total_expenses, "
        "((u.salary + COALESCE(ai.total_income, 0) - COALESCE(e.total_expense, 0)) / NULLIF(u.salary + COALESCE(ai.total_income, 0), 0)) * 100 as savings_rate "
        "FROM tbl_user u "
        "JOIN tbl_login l ON u.login_id = l.id "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_income FROM tbl_add_income WHERE MONTH(month) = MONTH(CURDATE()) GROUP BY login_id) ai ON u.login_id = ai.login_id "
        "LEFT JOIN (SELECT login_id, SUM(amount) as total_expense FROM tbl_expense WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id) e ON u.login_id = e.login_id"
    )
    
    return render_template("insights_users.html", 
        active_users=active_users, avg_expenses_per_user=avg_expenses_per_user, users=users
    )

@app.route('/insights/expenses')
def insights_expenses():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    
    # Category Expenses
    category_data = db.fetchall(
        "SELECT c.category_name, SUM(e.amount) as total FROM tbl_expense e "
        "JOIN tbl_category c ON e.category_id = c.id WHERE MONTH(e.date) = MONTH(CURDATE()) "
        "GROUP BY c.id, c.category_name"
    )
    category_labels = [row['category_name'] for row in category_data]
    category_values = [row['total'] or 0 for row in category_data]
    
    # Monthly Trends
    trend_data = db.fetchall(
        "SELECT MONTHNAME(date) as month, SUM(amount) as total FROM tbl_expense "
        "WHERE YEAR(date) = YEAR(CURDATE()) GROUP BY MONTH(date), MONTHNAME(date) ORDER BY MONTH(date)"
    )
    trend_labels = [row['month'] for row in trend_data]
    trend_values = [row['total'] or 0 for row in trend_data]
    
    return render_template("insights_expenses.html",
        category_labels=category_labels, category_data=category_values,
        trend_labels=trend_labels, trend_data=trend_values
    )

@app.route('/insights/suggestions')
def insights_suggestions():
    if not session.get("admin", False):
        return redirect(url_for('index'))
    
    suggestions = db.fetchall(
        "SELECT u.login_id as user_id, l.username, c.category_name, s.suggested_amount, "
        "COALESCE(e.total_amount, 0) as actual_spending "
        "FROM tbl_suggestions s "
        "JOIN tbl_user u ON s.login_id = u.login_id "
        "JOIN tbl_login l ON u.login_id = l.id "
        "JOIN tbl_category c ON s.category_id = c.id "
        "LEFT JOIN (SELECT login_id, category_id, SUM(amount) as total_amount FROM tbl_expense "
        "WHERE MONTH(date) = MONTH(CURDATE()) GROUP BY login_id, category_id) e "
        "ON s.login_id = e.login_id AND s.category_id = e.category_id "
        "WHERE s.month = '{}' AND s.year = {}".format(datetime.now().strftime('%B'), datetime.now().year)
    )
    
    return render_template("insights_suggestions.html", suggestions=suggestions)
    

    

    


# APIs



@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({'error': 'Username and password are required'}), 400
            
        # Verify credentials
        user = db.fetchone(
            "SELECT * FROM tbl_login WHERE username='{}' AND password='{}' AND role='user'"
            .format(username, password)
        )
        
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
            
        return jsonify({
            'message': 'Login successful',
            'username': user['username'],
            'role': user['role'],
            'user_id': user.get('id')  
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        gender = data.get('gender')
        age = data.get('age')
        salary = data.get('salary')

        # Validate input
        if not all([username, password, name, gender, age]):
            return jsonify({'error': 'All fields are required'}), 400
        
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        if len(password) < 3:
            return jsonify({'error': 'Password must be at least 3 characters'}), 400
        if gender not in ['male', 'female', 'other']:
            return jsonify({'error': 'Invalid gender value'}), 400
        try:
            age = int(age)
            if age < 0 or age > 150:
                return jsonify({'error': 'Invalid age'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Age must be a valid number'}), 400

        # Check if username already exists
        existing_user = db.fetchone(
            "SELECT * FROM tbl_login WHERE username='{}'".format(username)
        )
        if existing_user:
            return jsonify({'error': 'Username already taken'}), 409

        # Insert into tbl_login with role 'user' and get the login_id
        login_id = db.executeAndReturnId(
            "INSERT INTO tbl_login (username, password, role) VALUES ('{}', '{}', 'user')"
            .format(username, password)
        )

        # Insert into tbl_user with the retrieved login_id
        db.execute(
            "INSERT INTO tbl_user (name, gender, age, login_id,salary) VALUES ('{}', '{}', '{}', {},'{}')"
            .format(name, gender, age, login_id, salary)
        )

        return jsonify({
            'message': 'User registered successfully',
            'username': username,
            'name': name,
            'gender': gender,
            'age': age,
            'login_id': login_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>', methods=['GET', 'PUT'])
def get_user(user_id):
    try:
        if request.method == 'PUT':
            data = request.get_json()
            user = db.fetchone("SELECT * FROM tbl_user WHERE login_id = {}".format(user_id))
            login = db.fetchone("SELECT * FROM tbl_login WHERE id = {}".format(user_id))
            if not user or not login:
                return jsonify({'error': 'User not found'}), 404

            # Update only provided fields
            username = data.get('username', login['username'])
            password = data.get('password', login['password'])
            name = data.get('name', user['name'])
            gender = data.get('gender', user['gender'])
            age = data.get('age', user['age'])
            salary = data.get('salary', user['salary'])

            # Validation
            if not all([username, password, name, gender, age]):
                return jsonify({'error': 'Required fields missing'}), 400
            # ... (rest of validation logic remains the same)

            db.execute("UPDATE tbl_login SET username = '{}', password = '{}' WHERE id = {}".format(username, password, user_id))
            db.execute("UPDATE tbl_user SET name = '{}', gender = '{}', age = '{}', salary = '{}' WHERE login_id = {}".format(name, gender, age, salary, user_id))
            return jsonify({'message': 'User updated successfully'}), 200
        else:
            # GET logic remains unchanged
            user = db.fetchone("SELECT u.*, l.username FROM tbl_user u JOIN tbl_login l ON u.login_id = l.id WHERE u.login_id = {}".format(user_id))
            if not user:
                return jsonify({'error': 'User not found'}), 404
            return jsonify({
                'user_id': user['login_id'],
                'username': user['username'],
                'name': user['name'],
                'salary': user['salary'],
                'age': user['age'],
                'gender': user['gender'],
            }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/user/<int:user_id>/verify-password', methods=['POST'])
def verify_password(user_id):
    try:
        data = request.get_json()
        password = data.get('password')
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        
        user = db.fetchone("SELECT password FROM tbl_login WHERE id = {}".format(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        is_valid = user['password'] == password  # Direct comparison (not secure in production)
        return jsonify({'isValid': is_valid}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/user/<int:user_id>/salary', methods=['PUT'])
def update_salary(user_id):
    try:
        data = request.get_json()
        salary = data.get('salary')
        if not isinstance(salary, (int, float)) or salary < 0:
            return jsonify({'error': 'Invalid salary'}), 400
        db.execute("UPDATE tbl_user SET salary = '{}' WHERE login_id = {}".format(salary, user_id))
        return jsonify({'message': 'Salary updated successfully', 'salary': salary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/user/<int:user_id>/expenses', methods=['GET'])
def get_user_expenses(user_id):
    try:
        # Assuming a table tbl_expense with login_id, amount, and date
        total_expenses = db.fetchone(
            "SELECT SUM(amount) as total FROM tbl_expense WHERE login_id = {} AND YEAR(date) = YEAR(CURDATE())".format(user_id)
        )
        return jsonify({
            'total_expenses': total_expenses['total'] or 0,
            'year': datetime.now().year,
            'month': datetime.now().strftime('%B')  # Full month name
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


@app.route('/api/user/<int:user_id>/additional-income', methods=['POST'])
def add_additional_income(user_id):
    try:
        data = request.get_json()
        amount = data.get('amount')
        if not isinstance(amount, (int, float)) or amount < 0:
            return jsonify({'error': 'Invalid amount'}), 400
        month = datetime.now().strftime('%Y-%m')  # e.g., '2025-03'
        db.execute(
            "INSERT INTO tbl_add_income (login_id, amount, month) VALUES ({},'{}','{}')".format(user_id, amount, month)
        )
        return jsonify({'message': 'Additional income added', 'amount': amount, 'month': month}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/category', methods=['GET'])
def get_categories():
    try:
        categories = db.fetchall("SELECT * FROM tbl_category")
        return jsonify(categories), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/expense/<int:user_id>', methods=['POST','GET','PUT','DELETE'])
def add_expense(user_id):
    try:
        if request.method == 'POST':
            data = request.get_json()
            category_id = data.get('category_id')
            amount = data.get('amount')
            details = data.get('details')
            source = data.get('source')
            # date = data.get('date') ? data.get('date') : datetime.now().strftime('%Y-%m-%d')
            date = data.get('date') or datetime.now().strftime('%Y-%m-%d')
            db.single_insert("INSERT INTO tbl_expense (login_id, category_id, amount, details, source, date) VALUES ({}, {}, {}, '{}', '{}', '{}')".format(user_id, category_id, amount, details, source, date))
            return jsonify({'message': 'Expense added successfully'}), 201
        
        elif request.method == 'GET':
            expenses = db.fetchall("SELECT * FROM tbl_expense WHERE login_id = {}".format(user_id))
            return jsonify(expenses), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            expense_id = data.get('expense_id')
            category_id = data.get('category_id')
            amount = data.get('amount')
            details = data.get('details')
            source = data.get('source')
            date = data.get('date')
            db.execute("UPDATE tbl_expense SET category_id = {}, amount = {}, details = '{}', source = '{}', date = '{}' WHERE id = {}".format(category_id, amount, details, source, date, expense_id))
            return jsonify({'message': 'Expense updated successfully'}), 200
        
        elif request.method == 'DELETE':
            expense_id = request.args.get('expense_id')
            db.execute("DELETE FROM tbl_expense WHERE id = {}".format(expense_id))
            return jsonify({'message': 'Expense deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/priority/<int:user_id>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def add_priority(user_id):
    valid_priorities = ['high', 'medium', 'low']
    try:
        if request.method == 'POST':
            data = request.get_json()
            category_id = data.get('category_id')
            priority = data.get('priority')
            
            if not category_id or not isinstance(category_id, int):
                return jsonify({'error': 'Invalid or missing category_id'}), 400
            if priority not in valid_priorities:
                return jsonify({'error': "Priority must be 'high', 'medium', or 'low'"}), 400
            
            priority_exist = db.fetchone("SELECT * FROM tbl_priority WHERE login_id = {} AND category_id = {}".format(user_id, category_id))
            if priority_exist:
                return jsonify({'error': 'Priority already exists for this category'}), 400
            
            db.single_insert("INSERT INTO tbl_priority (login_id, category_id, priority) VALUES ({}, {}, '{}')".format(user_id, category_id, priority))
            return jsonify({'message': 'Priority added successfully'}), 201
        
        elif request.method == 'GET':
            priorities = db.fetchall("SELECT * FROM tbl_priority WHERE login_id = {}".format(user_id))
            return jsonify(priorities), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            priority_id = data.get('priority_id')
            category_id = data.get('category_id')
            priority = data.get('priority')
            
            if not priority_id or not isinstance(priority_id, int):
                return jsonify({'error': 'Invalid or missing priority_id'}), 400
            if not category_id or not isinstance(category_id, int):
                return jsonify({'error': 'Invalid or missing category_id'}), 400
            if priority not in valid_priorities:
                return jsonify({'error': "Priority must be 'high', 'medium', or 'low'"}), 400
            
            db.execute("UPDATE tbl_priority SET category_id = {}, priority = '{}' WHERE id = {}".format(category_id, priority, priority_id))
            return jsonify({'message': 'Priority updated successfully'}), 200
        
        elif request.method == 'DELETE':
            data = request.get_json()
            priority_id = data.get('priority_id')
            if not priority_id or not isinstance(priority_id, int):
                return jsonify({'error': 'Invalid or missing priority_id'}), 400
            
            db.execute("DELETE FROM tbl_priority WHERE id = {}".format(priority_id))
            return jsonify({'message': 'Priority deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

# @app.route('/api/suggestion/<int:user_id>', methods=['GET', 'POST', 'PUT', 'DELETE'])
# def add_suggestion(user_id):
#     try:
#         if request.method == 'POST':
#             # Fetch user priorities
#             priorities = db.fetchall(
#                 "SELECT p.priority, c.category_name, c.id as category_id "
#                 "FROM tbl_priority p INNER JOIN tbl_category c ON p.category_id = c.id "
#                 "WHERE p.login_id = {}".format(user_id)
#             )
#             if not priorities:
#                 return jsonify({'error': 'No priorities found for user'}), 404

#             # Fetch previous expenses grouped by category
#             expenses = db.fetchall(
#                 "SELECT e.category_id, c.category_name, SUM(e.amount) as total_amount "
#                 "FROM tbl_expense e INNER JOIN tbl_category c ON e.category_id = c.id "
#                 "WHERE e.login_id = {} GROUP BY e.category_id, c.category_name".format(user_id)
#             )
#             total_expenses = sum(expense['total_amount'] for expense in expenses) if expenses else 0

#             # Fetch total income (salary + additional income)
#             income_data = db.fetchone(
#                 "SELECT (IFNULL(SUM(a.amount), 0) + IFNULL(u.salary, 0)) as total_amount "
#                 "FROM tbl_user u LEFT JOIN tbl_add_income a ON a.login_id = u.login_id "
#                 "WHERE u.login_id = {}".format(user_id)
#             )
#             total_income = income_data['total_amount'] if income_data else 0
#             if total_income <= 0:
#                 return jsonify({'error': 'No income data available'}), 400

#             # Define priority weights
#             priority_weights = {'high': 0.4, 'medium': 0.35, 'low': 0.25}
#             total_weight = sum(priority_weights[p['priority']] for p in priorities)

#             # Calculate suggestions
#             suggestions = []
#             current_month = datetime.now().strftime('%B')  # e.g., "March"
#             current_year = datetime.now().year  # e.g., 2025

#             for priority in priorities:
#                 category_id = priority['category_id']
#                 priority_weight = priority_weights[priority['priority']] / total_weight
                
#                 # Find previous expense for this category
#                 expense = next((e for e in expenses if e['category_id'] == category_id), None)
#                 past_expense = expense['total_amount'] if expense else 0
#                 expense_weight = (past_expense / total_expenses) if total_expenses > 0 else 0

#                 # Combine weights (70% priority, 30% past expense)
#                 combined_weight = (0.7 * priority_weight) + (0.3 * expense_weight if total_expenses > 0 else 0)
#                 suggested_amount = total_income * combined_weight

#                 suggestions.append({
#                     'login_id': user_id,
#                     'category_id': category_id,
#                     'suggested_amount': round(suggested_amount, 2),
#                     'month': current_month,
#                     'year': current_year
#                 })

#             # Normalize suggestions to fit total income
#             total_suggested = sum(s['suggested_amount'] for s in suggestions)
#             if total_suggested > total_income:
#                 scale_factor = total_income / total_suggested
#                 for s in suggestions:
#                     s['suggested_amount'] = round(s['suggested_amount'] * scale_factor, 2)

#             # Clear existing suggestions for this month
#             db.execute(
#                 "DELETE FROM tbl_suggestions WHERE login_id = {} AND month = '{}' AND year = {}".format(
#                     user_id, current_month, current_year
#                 )
#             )

#             # Insert new suggestions
#             for suggestion in suggestions:
#                 db.execute(
#                     "INSERT INTO tbl_suggestions (login_id, category_id, suggested_amount, month, year) "
#                     "VALUES ({}, {}, {}, '{}', {})".format(
#                         suggestion['login_id'], suggestion['category_id'], suggestion['suggested_amount'],
#                         suggestion['month'], suggestion['year']
#                     )
#                 )

#             return jsonify({'message': 'Suggestions added successfully', 'suggestions': suggestions}), 201

#         elif request.method == 'GET':
#             current_month = datetime.now().strftime('%B')
#             current_year = datetime.now().year
#             suggestions = db.fetchall(
#                 "SELECT s.category_id, c.category_name, s.suggested_amount "
#                 "FROM tbl_suggestions s INNER JOIN tbl_category c ON s.category_id = c.id "
#                 "WHERE s.login_id = {} AND s.month = '{}' AND s.year = {}".format(
#                     user_id, current_month, current_year
#                 )
#             )
#             return jsonify(suggestions), 200

#         # PUT and DELETE can be implemented if needed
#         else:
#             return jsonify({'error': 'Method not implemented'}), 501

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500



@app.route('/api/suggestion/<int:user_id>', methods=['GET', 'POST'])
def add_suggestion(user_id):
    try:
        if request.method == 'POST':
            print(f"🔵 Processing request for user ID: {user_id}")

            # 🔹 Fetch user priorities
            priorities = db.fetchall("""
                SELECT p.priority, c.category_name, c.id as category_id 
                FROM tbl_priority p 
                INNER JOIN tbl_category c ON p.category_id = c.id 
                WHERE p.login_id = {}
            """.format(user_id))
            print(f"🟢 Fetched Priorities: {priorities}")

            if not priorities:
                return jsonify({'error': 'No priorities found for user'}), 404

            # 🔹 Fetch previous expenses
            expenses = db.fetchall("""
                SELECT e.category_id, c.category_name, SUM(e.amount) as total_amount 
                FROM tbl_expense e 
                INNER JOIN tbl_category c ON e.category_id = c.id 
                WHERE e.login_id = {} 
                GROUP BY e.category_id, c.category_name
            """.format(user_id))
            print(f"🟢 Fetched Expenses: {expenses}")

            total_expenses = sum((e['total_amount'] or 0) for e in expenses) if expenses else 0
            print(f"🔹 Total Expenses: {total_expenses}")

            # 🔹 Fetch total income
            income_data = db.fetchone("""
                SELECT (IFNULL(SUM(a.amount), 0) + IFNULL(u.salary, 0)) as total_amount 
                FROM tbl_user u 
                LEFT JOIN tbl_add_income a ON a.login_id = u.login_id 
                WHERE u.login_id = {}
            """.format(user_id))
            print(f"🟢 Fetched Income Data: {income_data}")

            total_income = income_data['total_amount'] if income_data and income_data['total_amount'] is not None else 0
            print(f"🔹 Total Income: {total_income}")

            if total_income <= 0:
                return jsonify({'error': 'No valid income data available'}), 400

            # 🔹 Priority Weights
            priority_weights = {'high': 0.5, 'medium': 0.3, 'low': 0.2}
            total_weight = sum(priority_weights[p['priority']] for p in priorities)
            print(f"🔹 Total Weight: {total_weight}")

            # 🔹 AI-Enhanced Suggestions
            suggestions = []
            current_month = datetime.now().strftime('%B')
            current_year = datetime.now().year

            for priority in priorities:
                category_id = priority['category_id']
                category_name = priority['category_name']
                priority_level = priority['priority']

                priority_weight = priority_weights.get(priority_level, 0) / total_weight
                past_expense = next((e['total_amount'] or 0 for e in expenses if e['category_id'] == category_id), 0)
                expense_weight = (past_expense / total_expenses) if total_expenses > 0 else 0
                
                predicted_expense = predict_expense(category_id, user_id, db) or 0.0
                ai_weight = (0.6 * priority_weight) + (0.4 * expense_weight)

                # 🔥 Debugging Logs 🔥
                print(f"\n🔸 Checking category: {category_name} (ID: {category_id})")
                print(f"    🟡 Priority: {priority_level}")
                print(f"    🟡 Priority Weight: {priority_weight}")
                print(f"    🟡 Expense Weight: {expense_weight}")
                print(f"    🟡 Predicted Expense: {predicted_expense}")
                print(f"    🟡 AI Weight: {ai_weight}")
                print(f"    🟡 Total Income: {total_income}")

                # 🔴 Ensure no None values before calculation
                predicted_expense = float(predicted_expense if predicted_expense is not None else 0)
                total_income_safe = float(total_income if total_income is not None else 0)
                ai_weight = float(ai_weight if ai_weight is not None else 0)

                print(f"🔍 Debug Before Calculation: predicted_expense={predicted_expense}, total_income={total_income_safe}, ai_weight={ai_weight}")

                try:
                    suggested_amount = min(predicted_expense, total_income_safe * ai_weight)
                except TypeError as e:
                    print(f"❌ Exception Caught: {e}")
                    print(f"❌ Debug Values at Error: predicted_expense={predicted_expense}, total_income={total_income_safe}, ai_weight={ai_weight}")
                    suggested_amount = 0

                print(f"✅ Final Suggested Amount for {category_name}: {suggested_amount}")

                suggestions.append({
                    'login_id': user_id,
                    'category_id': category_id,
                    'suggested_amount': round(suggested_amount, 2),
                    'month': current_month,
                    'year': current_year
                })

            # 🔹 Normalize suggestions if needed
            total_suggested = sum(s['suggested_amount'] for s in suggestions)
            print(f"🔹 Total Suggested: {total_suggested}")
            if total_suggested > total_income and total_suggested > 0:
                scale_factor = total_income / total_suggested
                print(f"⚖️ Scaling suggestions by factor: {scale_factor}")
                for s in suggestions:
                    s['suggested_amount'] = round(s['suggested_amount'] * scale_factor, 2)

            # 🔹 Delete old suggestions for this month
            db.execute("""
                DELETE FROM tbl_suggestions WHERE login_id = {} AND month = '{}' AND year = {}
            """.format(user_id, current_month, current_year))

            # 🔹 Insert new AI-enhanced suggestions
            for suggestion in suggestions:
                db.execute("""
                    INSERT INTO tbl_suggestions (login_id, category_id, suggested_amount, month, year) 
                    VALUES ({}, {}, {}, '{}', {})
                """.format(
                    suggestion['login_id'], suggestion['category_id'], suggestion['suggested_amount'],
                    suggestion['month'], suggestion['year']
                ))

            print(f"✅ Suggestions Generated: {suggestions}")
            return jsonify({'message': '✅ AI-enhanced suggestions added successfully', 'suggestions': suggestions}), 201

        elif request.method == 'GET':
            suggestions = db.fetchall("""
                SELECT s.category_id, c.category_name, s.suggested_amount, s.month, s.year 
                FROM tbl_suggestions s 
                INNER JOIN tbl_category c ON s.category_id = c.id 
                WHERE s.login_id = {}
            """.format(user_id))
            return jsonify(suggestions), 200

        else:
            return jsonify({'error': 'Method not implemented'}), 501

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return jsonify({'error': str(e)}), 500


def predict_expense(category_id, user_id, db):
    """Predict future expenses using linear regression."""
    past_expenses = db.fetchall("""
        SELECT SUM(e.amount) as total_amount, MONTH(e.date) as month, YEAR(e.date) as year 
        FROM tbl_expense e 
        WHERE e.login_id = {} AND e.category_id = {} 
        GROUP BY YEAR(e.date), MONTH(e.date) 
        ORDER BY YEAR(e.date), MONTH(e.date)
    """.format(user_id, category_id))
    
    print(f"🔍 predict_expense for category_id={category_id}: past_expenses={past_expenses}")
    
    if not past_expenses or len(past_expenses) < 2:
        return past_expenses[0]['total_amount'] or 0 if past_expenses else 0  

    X = np.array([[exp['year'] * 12 + exp['month']] for exp in past_expenses])
    y = np.array([exp['total_amount'] or 0 for exp in past_expenses])  

    model = LinearRegression()
    model.fit(X, y)

    next_month = datetime.now().year * 12 + datetime.now().month + 1
    predicted_expense = model.predict([[next_month]])[0]

    print(f"🔍 Predicted expense for category_id={category_id}: {predicted_expense}")
    return max(predicted_expense, 0)

    
@app.route('/api/progressbar/<int:user_id>', methods=['GET'])
def progressbar(user_id):
    try:
       
        # expense_data = db.fetchall(
        #     "SELECT c.category_name, SUM(e.amount) as total_amount, s.suggested_amount "
        #     "FROM tbl_expense e "
        #     "INNER JOIN tbl_category c ON e.category_id = c.id "
        #     "INNER JOIN tbl_suggestions s ON e.category_id = s.category_id "
        #     "WHERE e.login_id = {} AND e.date = CURDATE() "
        #     "GROUP BY c.category_name".format(user_id)
        # )
        # monthly
        expense_data = db.fetchall(
            "SELECT c.category_name, SUM(e.amount) as total_amount, s.suggested_amount "
            "FROM tbl_expense e "
            "INNER JOIN tbl_category c ON e.category_id = c.id "
            "INNER JOIN tbl_suggestions s ON e.category_id = s.category_id "
            "WHERE e.login_id = {} AND MONTH(e.date) = MONTH(CURDATE()) AND YEAR(e.date) = YEAR(CURDATE()) "
            "GROUP BY c.category_name".format(user_id)
        )
        return jsonify(expense_data), 200

    except Exception as e:  
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/<int:user_id>', methods=['GET'])
def notifications(user_id):
    try:
        notifications=db.fetchall("SELECT e.*,category_name FROM tbl_expense e inner join tbl_category c on e.category_id=c.id WHERE login_id = {} AND source = 'advance' AND date <= CURDATE()".format(user_id))
        return jsonify(notifications), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>/additional-income-sum', methods=['GET'])
def get_additional_income_sum(user_id):
    try:
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))  # e.g., "2025-03"
        income_data = db.fetchone(
            "SELECT SUM(amount) as sum FROM tbl_add_income WHERE login_id = {} AND month = '{}'".format(user_id, month)
        )
        return jsonify({'sum': income_data['sum'] or 0}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expense/<int:user_id>/by-category', methods=['GET'])
def get_expenses_by_category(user_id):
    try:
        month = datetime.now().strftime('%Y-%m')  # e.g., "2025-03"
        data = db.fetchall(
            "SELECT c.category_name, SUM(e.amount) as total_amount, c.id as category_id "
            "FROM tbl_expense e "
            "INNER JOIN tbl_category c ON e.category_id = c.id "
            "WHERE e.login_id = {} AND DATE_FORMAT(e.date, '%Y-%m') = '{}' "
            "GROUP BY c.id, c.category_name".format(user_id, month)
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/expense/<int:user_id>/trends', methods=['GET'])
def get_expense_trends(user_id):
    try:
        trends = db.fetchall(
            "SELECT YEAR(date) as year, MONTHNAME(date) as month, SUM(amount) as total_amount "
            "FROM tbl_expense WHERE login_id = {} "
            "GROUP BY YEAR(date), MONTH(date) "
            "ORDER BY YEAR(date), MONTH(date)".format(user_id)
        )
        return jsonify(trends), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/priority/<int:user_id>/vs-spending', methods=['GET'])
def get_priority_vs_spending(user_id):
    try:
        month = datetime.now().strftime('%Y-%m')
        data = db.fetchall(
            "SELECT c.category_name, p.priority, s.suggested_amount, SUM(e.amount) as total_amount "
            "FROM tbl_priority p "
            "INNER JOIN tbl_category c ON p.category_id = c.id "
            "INNER JOIN tbl_suggestions s ON p.category_id = s.category_id "
            "LEFT JOIN tbl_expense e ON p.category_id = e.category_id AND DATE_FORMAT(e.date, '%Y-%m') = '{}' "
            "WHERE p.login_id = {} AND s.month = '{}' AND s.year = {} "
            "GROUP BY c.category_name, p.priority, s.suggested_amount".format(
                month, user_id, datetime.now().strftime('%B'), datetime.now().year
            )
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>/summary', methods=['GET'])
def get_user_summary(user_id):
    try:
        month = datetime.now().strftime('%Y-%m')
        summary = db.fetchone(
                "SELECT "
                "  u.salary AS fixed_salary, "
                "  COALESCE(ai.total_additional_income, 0) AS additional_income, "
                "  (u.salary + COALESCE(ai.total_additional_income, 0)) AS total_income, "
                "  COALESCE(ei.total_expenses, 0) AS total_expenses, "
                "  (u.salary + COALESCE(ai.total_additional_income, 0) - COALESCE(ei.total_expenses, 0)) AS balance "
                "FROM tbl_user u "
                "LEFT JOIN ( "
                "  SELECT login_id, SUM(amount) AS total_additional_income "
                "  FROM tbl_add_income "
                "  WHERE month = '{}' "
                "  GROUP BY login_id "
                ") ai ON u.login_id = ai.login_id "
                "LEFT JOIN ( "
                "  SELECT login_id, SUM(amount) AS total_expenses "
                "  FROM tbl_expense "
                "  WHERE DATE_FORMAT(date, '%Y-%m') = '{}' "
                "  GROUP BY login_id "
                ") ei ON u.login_id = ei.login_id "
                "WHERE u.login_id = {}".format(month, month, user_id)
            )

        summary['month'] = datetime.now().strftime('%B')
        summary['year'] = datetime.now().year
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500   

@app.route('/api/user/<int:user_id>/additional-income-list', methods=['GET'])
def get_additional_income_list(user_id):
    try:
        month = datetime.now().strftime('%Y-%m')
        print(month)
        data = db.fetchall(
            "SELECT id, amount FROM tbl_add_income WHERE login_id = {} AND month = '{}'".format(user_id, month)
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>/additional-income/<int:income_id>', methods=['PUT'])
def update_additional_income(user_id, income_id):
    try:
        data = request.get_json()
        amount = data.get('amount')
        db.execute(
            "UPDATE tbl_add_income SET amount = {} WHERE id = {} AND login_id = {}".format(amount, income_id, user_id)
        )
        return jsonify({'message': 'Income updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>/additional-income/<int:income_id>', methods=['DELETE'])
def delete_additional_income(user_id, income_id):
    try:
        db.execute(
            "DELETE FROM tbl_add_income WHERE id = {} AND login_id = {}".format(income_id, user_id)
        )
        return jsonify({'message': 'Income deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500     
  





if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')