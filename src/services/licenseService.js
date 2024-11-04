class LicenseService {
    constructor() {
        this.userLicenseTier = null;
        this.listeners = [];
    }

    // Method to set the user's license tier
    setUserLicenseTier(tier) {
        this.userLicenseTier = tier;
        this.notifyListeners();
    }

    // Method to get the user's current license tier
    getUserLicenseTier() {
        return this.userLicenseTier;
    }

    // Method to add a listener for license tier changes
    addListener(listener) {
        this.listeners.push(listener);
    }

    // Method to notify all listeners of a change in license tier
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.userLicenseTier));
    }
}

export default new LicenseService();
