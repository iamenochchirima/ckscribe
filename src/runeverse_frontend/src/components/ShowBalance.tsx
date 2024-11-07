import React, { useEffect, useState } from 'react';

import { useAuth } from '../hooks/Context';
import { toast } from 'react-toastify';

const ShowBalance: React.FC = () => {
    const [btcBalance, setBtcBalance] = useState<bigint>(0n);

    const { backendActor } = useAuth();

    useEffect(() => {
        if (backendActor) {
            refreshBalance();
        }
    }, [backendActor]);

    const refreshBalance = async () => {
        try {
            const balance = await backendActor.get_btc_balance();
            console.log("Balance: ", balance);
            setBtcBalance(balance);
        } catch (error) {
            console.error("Error: ", error);
            toast.error("Error fetching balance");
        }
    };

    return (
        <div className="flex items-center justify-center p-5 bg-gray-100 rounded-lg shadow">
            <p className="text-lg font-bold text-gray-800 mr-5">
                Your Bitcoin Balance in Satoshis: {btcBalance.toString()}₿
            </p>
            <button
                className="px-3 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                onClick={refreshBalance}
            >
                Refresh Balance
            </button>
        </div>
    );
};

export default ShowBalance;
