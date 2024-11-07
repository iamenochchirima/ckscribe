import React, { useEffect, useState } from 'react';

import ShowBalance from './ShowBalance';
import { useAuth } from '../hooks/Context';
import Copy from './Copy';
    

const BtcPayment: React.FC = () => {
  const [btcDepositAddress, setBtcDepositAddress] = useState<string>('');

  const { backendActor } = useAuth();

  const fetchBtcAddress = async () => {
    const address = await backendActor.get_deposit_address_for_bitcoin();
    setBtcDepositAddress(address);
  };

  useEffect(() => {
    if (backendActor) {
        fetchBtcAddress();
    }
  }, [backendActor]);

  return (
    <div className="flex flex-col items-center p-5 bg-gray-100 rounded-lg shadow-md">
      <span className="text-lg font-bold text-gray-800 mb-2">
        Bitcoin Address: {btcDepositAddress}
      </span>
      <Copy value={btcDepositAddress} />
      <ShowBalance />
    </div>
  );
};

export default BtcPayment;
