# EnergyConsumptionOptimizer
ECO is a web-based platform designed for the monitoring and optimization of household consumption related to electricity,
gas, and water. The platform is implemented through integration with intelligent power outlets (smart furniture hookups)
deployed across different areas of the home. Thanks to the continuous data acquisition performed by these devices,
the platform provides real-time monitoring of utility usage. The system also implements predictive functionalities for
estimating future consumption. Finally, the platform allows the configuration of customized consumption thresholds which,
supported by an alerting system, automatically send notifications to the user when the defined critical conditions are met.


## Configuration
### Prerequisites
- **Docker**

Before starting the system, specific environment variables must be configured.  
These can be provided via a `.env` file in the project root or through the host environment.

### Required Variables

The following variables are strictly required and have **no default values**:

| Variable | Description |
|--------|-------------|
| `JWT_SECRET_KEY` | Secret used for signing and verifying JWT tokens |
| `RESET_CODE` | Code used for the administrator password reset |
| `DOCKER_INFLUXDB_INIT_USERNAME` | InfluxDB username |
| `DOCKER_INFLUXDB_INIT_PASSWORD` | InfluxDB password |
| `DOCKER_INFLUXDB_INIT_ADMIN_TOKEN` | InfluxDB admin token |

## Step-by-step Guide

### 1. Clone the Repository
```bash
git clone https://github.com/EnergyConsumptionOptimizer/EnergyConsumptionOptimizer
```
### 2. Setup Environment
Navigate to the project root and configure the [Required Variables](#required-variables). You can create an `.env` file from the provided example:
```bash
cp .env-example .env
```

### 3. Start the System
To start up the system, run the command:
```bash
docker compose up
```

### 4. Access
Once the system is running, the application is accessible via browser at URL: http://localhost:80

The system comes with a pre-configured administrator account:
- Username: admin
- Password: admin

To stop the system and remove containers, run the command:
```bash
docker compose down
```