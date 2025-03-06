# eBay Price Tracker

A portfolio project that scrapes eBay listings, stores product and price data in a MySQL database, and provides a React-based interface to visualize price history and listing details. Currently, it tracks *Funko Pop Doctor Doom #561* as a demonstration, but it can be extended to monitor any eBay product.

This project demonstrates my expertise in Python web scraping, database management, REST API development, and front-end integration with React. It serves as a portfolio piece to showcase my ability to build robust, scalable, and user-friendly solutions for real-world business challenges.

## Features

- **Web Scraping**: Uses Scrapy to crawl eBay listings, capturing data like price, condition, seller, and more.
- **Price History Tracking**: Stores chronological price data in MySQL to analyze trends over time.
- **Data Visualization**: A React front end displays listings in a grid view and offers a detailed page with a price history chart.
- **Filtering**: Filter listings by active/ended status, "signed" items, or "in box" status.
- **Automated Updates**: Includes a script (`refresh_products.py`) to periodically check listing status (e.g., ended auctions).

## Screenshots

### Web Interface
![image](https://github.com/user-attachments/assets/fda2d815-58f4-42d4-ada5-d19e84e10a75)

### Scraper Execution
![image](https://github.com/user-attachments/assets/0de1ad74-7d97-4e85-9e59-df8234820a42)

## Why This Project?

This project is designed to help businesses, resellers, and collectors effortlessly monitor and analyze eBay price trends. By providing an easy-to-use interface and detailed price history tracking, users can make informed decisions, identify market trends, and optimize their buying or selling strategies. It offers valuable insights for eBay users who need to stay competitive in a dynamic marketplace.

## Technology Stack

- **Scrapy (Python)**: Handles eBay scraping and data extraction.
- **Flask (Python)**: Provides a RESTful API (`/api/...`) for the front end.
- **MySQL**: Stores product details and price history.
- **React (JavaScript)**: Powers the user interface with dynamic visualizations.
- **Optional Tools**: Supports proxies (via `webshare_proxies.txt`) and eBay Taxonomy API integration.

## Project Structure

```
price-tracker/
├── app.py                 # Flask API entry point
├── refresh_products.py    # Script to update listing status (e.g., ended)
├── core/                  # Core utilities
│   ├── captcha_middleware.py  # Detects CAPTCHA pages
│   ├── category_mapping.py   # Maps eBay categories to database
│   ├── config.py            # Environment variable handling
│   ├── db_connection.py     # MySQL connection setup
│   ├── ebay_taxonomy.py     # eBay Taxonomy API integration
│   ├── fetch_categories.py  # Fetches and stores eBay categories
│   ├── middlewares.py       # Scrapy middleware (e.g., proxies, user agents)
│   └── random_delay_middleware.py  # Adds random delays to scraping
├── scrapers/              # Scrapy spider and pipeline
│   ├── spiders/           
│   │   └── ebay_spider.py # eBay scraping logic
│   ├── items.py          # Defines data structure for scraped items
│   ├── pipelines.py      # Processes items into MySQL
│   ├── settings.py       # Scrapy configuration
│   └── routes.py         # Unused web routes (optional)
├── api/                   # Flask API routes
│   ├── api_routes.py     # API endpoints for product data
│   └── __init__.py       # Blueprint initialization
├── frontend/              # React front-end (create-react-app structure)
│   ├── src/              # React components, pages, and styles
│   ├── public/           # Static assets (e.g., favicon, manifest)
│   └── package.json      # Front-end dependencies
└── scrapy.cfg            # Scrapy project configuration
```

## Database Schema

The MySQL database (`price_tracker_us`) includes three main tables:

- **product**  
  ```
  product_id (PK), item_id (unique), title, item_condition, normalized_condition, signed, in_box, url, image_url, seller_username, category, listing_type, bids_count, time_remaining, buy_it_now_price, ended, category_id (FK)
  ```

- **price_history**  
  ```
  id (PK), product_id (FK), price, buy_it_now_price, bids_count, time_remaining, date_scraped
  ```

- **category**  
  ```
  category_id (PK), ebay_id (unique), name, parent_ebay_id, level
  ```

For the full schema, refer to the SQL creation script provided in the query.

## Requirements

- **Python 3.9+**: For Scrapy, Flask, and backend scripts.
- **Node.js 14+**: For the React front end.
- **MySQL**: Local or remote database instance.
- **Environment Variables**: Set in a `.env` file in the root directory:
  ```
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=price_tracker_us
  EBAY_APP_ID=your_ebay_app_id
  EBAY_CLIENT_ID=your_ebay_client_id
  EBAY_CLIENT_SECRET=your_ebay_client_secret
  ```

## Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/LeonardCote08/price-tracker.git
   cd price-tracker
   ```

2. **Set Up Environment Variables**:
   Create a `.env` file in the root directory with the variables listed above.

3. **Initialize the MySQL Database**:
   - Run the SQL script provided in the query to create the `price_tracker_us` database and tables.
   - Example:
     ```bash
     mysql -u root -p < database_setup.sql
     ```

4. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: You may need to create a `requirements.txt` with `scrapy`, `flask`, `mysql-connector-python`, `python-dotenv`, etc.)*

5. **Install Front-End Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

6. **(Optional) Build the Front End**:
   ```bash
   npm run build
   ```
   Or run in development mode:
   ```bash
   npm start
   ```

## Usage

### 1. Scrape eBay Listings

Run the Scrapy spider from the project root with a keyword to populate the database with listings. Depending on your filtering needs, you can adjust the command parameters. For example, the following command includes additional filtering options:

```bash
scrapy crawl ebay_spider -a keyword="Funko Pop Doctor Doom #561 -17 -990 -916 -591 -Venomized"
```
**Note:** The extra parameters (`-17 -990 -916 -591 -Venomized`) are used for advanced filtering during scraping. Remove or modify them if they don't suit your needs.

### 2. Refresh Product Status
Check if listings have ended:
```bash
python refresh_products.py
```
This task is automated using cron jobs, which run the scraping and refresh tasks at scheduled intervals (e.g., scraping at 8:00 and 20:00 UTC, and refreshing every 12 hours).

### 3. Start the Flask API
```bash
cd ..
python app.py
```
The API will be available at `http://127.0.0.1:5000/api/...`.

### 4. Access the React Front End
- In development mode: Open `http://localhost:3000` (proxied to Flask API).
- In production: Serve the `frontend/build` folder via Flask or a static file server.

## Next Steps & Enhancements

- **Advanced Analytics**: Implement trend forecasting (e.g., linear regression) for price predictions.
- **Notifications**: Add email or Slack alerts for price drops or ended listings.
- **Multi-Product Support**: Expand to track multiple items simultaneously.
- **Dockerization**: Containerize the app for easier deployment.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -m 'Add a feature'`).
4. Push to your branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to modify and distribute it, provided the license is included.

## Contact

If you are interested in hiring me or discussing a project, feel free to reach out via my email address: [leonard.cote08@gmail.com](mailto:leonard.cote08@gmail.com)


