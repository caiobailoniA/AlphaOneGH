import React, { useState, useEffect } from 'react';
import LicenseService from '../services/licenseService';

const LicenseButton = () => {
    const [licenseTier, setLicenseTier] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const updateLicenseTier = (tier) => {
            if (tier === null) {
                setError('Error determining license tier');
            } else {
                setError(null);
                setLicenseTier(tier);
            }
        };

        LicenseService.addListener(updateLicenseTier);
        updateLicenseTier(LicenseService.getUserLicenseTier());

        return () => {
            // Cleanup listener if needed
        };
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            {licenseTier === 'premium' && <button>Click-through Button</button>}
        </div>
    );
};

export default LicenseButton;
