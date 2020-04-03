class UsersService {
    constructor() {
        this.online_customers = [ ], 
        this.online_drivers =[] ;
    }

    addCustomer(customer) {
        this.online_customers = [customer, ...this.online_customers];
    }

    addDriver(driver) {
        this.online_drivers = [driver, ...this.online_drivers];
    }

    removeUser(socketID) {
        this.online_customers = this.online_customers.filter(customer => customer.socketID != socketID);
        this.online_drivers = this.online_drivers.filter(driver => driver.socketID != socketID);
    }

    getOnlineCustomers() {
        return this.online_customers;
    }

    getOnlineDrivers() {
        return this.online_drivers;
    }

    getCustomerById(customerID) {
        return this.online_customers.filter(customer => customer.profile.customerID == customerID)[0]
    }

    getDriverById(driverID) {
        return this.online_drivers.filter(driver => driver.profile.driverID == driverID)[0];
    }

}

module.exports = UsersService;