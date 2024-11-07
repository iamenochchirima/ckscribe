import React, { useEffect, useState } from 'react';
import Copy from './Copy';
import { useAuth } from '../hooks/Context';
import Button from './Button';
import ShowBalance from './ShowBalance';
import { toast } from 'react-toastify';



const CkbtcPayment: React.FC = () => {

  const { backendActor, blockId, setBlockId } = useAuth();

  const [ckbtcDepositAddress, setCkbtcDepositAddress] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('Unknown');


  const fetchCkbtcAddress = async () => {
    const address = await backendActor.get_deposit_address_for_ckbtc();
    setCkbtcDepositAddress(address);
  };

  const confirmAndConvertCkbtc = async () => {
    try {
      const id = await backendActor.confirm_and_convert_ckbtc();
      setBlockId(id);
      await queryTransactionStatus();
    } catch (error) {
      toast.error(`Failed to confirm and convert CkBTC: ${error}`);
    }
  };

  const queryTransactionStatus = async () => {
    const id = blockId
    if (id == null) {
      toast.error('No Block Id Found');
      return;
    }

    try {
      const status = await backendActor.query_conversion_status(id);
      setPaymentStatus(status);
    } catch (error) {
      toast.error(`Failed to fetch status: ${error}`);
    }
  };

  useEffect(() => {
    fetchCkbtcAddress();
  }, []);

  return (
    <div className="flex flex-col items-center p-5 bg-gray-100 rounded-lg shadow-md">
      <div className="mb-2">
        <span className="text-lg font-bold text-gray-800">
          CkBTC Address: {ckbtcDepositAddress}
        </span>
        <Copy value={ckbtcDepositAddress} />
      </div>
      <div className="my-3">
        <Button onClick={confirmAndConvertCkbtc}
          label="Confirm Deposit of CkBTC"
        />
      </div>
      {blockId && (
        <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-md">
          <p className="p-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded font-bold mb-2 text-center max-w-full break-words">
            Don't Refresh or Close the page, The block Id will be lost &#9432;
          </p>
          <p className="text-lg font-bold text-gray-800 p-2 bg-gray-100 border border-gray-300 rounded max-w-full break-words">
            Status: {paymentStatus}
          </p>
          <Button onClick={queryTransactionStatus}
            label="Refresh Status"
          />
        </div>
      )}
      <ShowBalance />
    </div>
  );
};

export default CkbtcPayment;