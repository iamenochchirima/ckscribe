import React, { useEffect, useState } from 'react';

import ShowBalance from './ShowBalance';
import Copy from './Copy';
import { useAuth } from '../../../../../hooks/Context';
    

const BtcPayment: React.FC = () => {
  const [btcDepositAddress, setBtcDepositAddress] = useState<string>('');

  const { inscribeActor } = useAuth();

  const fetchBtcAddress = async () => {
    const address = await inscribeActor.get_deposit_address_for_bitcoin();
    setBtcDepositAddress(address);
  };

  useEffect(() => {
    if (inscribeActor) {
        fetchBtcAddress();
    }
  }, [inscribeActor]);

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
