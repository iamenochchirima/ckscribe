import React, { useState } from 'react';;
import PayWithBtc from './PayWithBtc';
import PayWithCkBtc from './PayWithCkBTC';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../../hooks/Context';
import { EtchingArgs } from '../../../../../../../declarations/inscribe/inscribe.did';

const Etcher = () => {
  const [rune, setRune] = useState('');
  const [divisibility, setDivisibility] = useState(0);
  const [symbol, setSymbol] = useState('');
  const [cap, setCap] = useState(0);
  const [amount, setAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [endHeight, setEndHeight] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const [endOffset, setEndOffset] = useState(0);
  const [turbo, setTurbo] = useState(true);
  const [feeRate, setFeeRate] = useState(20);
  const [withBlockHeight, setWithBlockHeight] = useState(true);
  const [payWithBtc, setPayWithBtc] = useState(true);

  const { inscribeActor} = useAuth();

  const turboModeMessage = turbo ? 'Enabled' : 'Disabled';
  const payModeMessage = payWithBtc ? 'Pay with Bitcoin' : 'Pay with CkBTC';

  const etchRune = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('etch rune called');
    const premine = BigInt((percentage * cap) / 100);
    const symbolAsUnicode = symbol.codePointAt(0);
    
    if (symbolAsUnicode === undefined) {
        toast.error('Please Enter a Valid symbol');
      return;
    }

    const arg : EtchingArgs = {
      rune,
      premine,
      symbol: symbolAsUnicode,
      cap: BigInt(cap),
      amount: BigInt(amount),
      divisibility,
      fee_rate: [BigInt(feeRate)],
      turbo,
      height: withBlockHeight ? [[BigInt(startHeight), BigInt(endHeight)]] : [],
      offset: !withBlockHeight ? [[BigInt(startOffset), BigInt(endOffset)]] : [],
    };

    try {
      const result = await inscribeActor.etch_rune(arg);
      console.log(result);
        toast.success('Successfully submitted the Commit Transaction');
    } catch (e) {
      console.error(e);
        toast.error(`Failed to Etch Rune: ${e.toString()}`);
    }
  };

  // TODO: 1. Show the BTC, ICP, SOL etc balanes
  // 2 . Create a step process to etch 



  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg font-sans">
    {/* Pay Fee Section */}
    <div className="mb-6">
      <label htmlFor="payment-mode" className="block mb-2 font-semibold text-white">
      <span>
        Pay Fee
      </span>
        <span aria-label="Additional Information" className="text-sm text-white cursor-help" title="Pay Fee with Bitcoin or CkBTC">&#9432;</span>
      </label>
      <div className="flex space-x-4 mb-4">




        
      <button
          
                className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Pay With ckBTC
              </button>
                <button
          
                className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Pay With Bitcoin
              </button>
              <button
          
          className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Pay With ICP
        </button>
        <button
          
          className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Pay With Ethereum
        </button>
        
        <button
          
          className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Pay With Solana
        </button>
        

        <label className={`flex items-center space-x-2 cursor-pointer ${payWithBtc ? '' : ''}`}>
          <input type="radio" name="payment" value="btc" checked={payWithBtc} onChange={() => setPayWithBtc(true)} className="form-radio text-blue-500" />
          <span>Pay with Bitcoin</span>
        </label>
        <label className={`flex items-center space-x-2 cursor-pointer ${!payWithBtc ? '' : ''}`}>
          <input type="radio" name="payment" value="ckbtc" checked={!payWithBtc} onChange={() => setPayWithBtc(false)} className="form-radio text-blue-500" />
          <span>Pay with CkBTC</span>
        </label>
      </div>
      {payWithBtc ? <PayWithBtc /> : <PayWithCkBtc />}
    </div>

    {/* Rune Name Section */}
    <div className="mb-6">
      <label htmlFor="rune" className="block mb-2 font-semibold text-white">
        Rune
        <span aria-label="Rune Name Info" className="text-sm text-white cursor-help" title="Rune names are between 1 and 26 uppercase letters">&#9432;</span>
      </label>
      <input type="text" id="rune" name="rune" value={rune} onChange={(e) => setRune(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md text-lg" />
    </div>
  
    {/* Divisibility Section */}
    <div className="mb-6">
      <label htmlFor="divisibility" className="block mb-2 font-semibold text-white">
        Divisibility
        <span aria-label="Divisibility Info" className="text-sm text-white cursor-help" title="Defines how fine units can be divided, between 0 and 38">&#9432;</span>
      </label>
      <input type="number" id="divisibility" min="0" max="38" value={divisibility} onChange={(e) => setDivisibility(Number(e.target.value))} required className="w-full p-3 border border-gray-300 rounded-md text-lg" />
    </div>
  
    {/* Symbol Section */}
    <div className="mb-6">
      <label htmlFor="symbol" className="block mb-2 font-semibold text-white">
        Symbol
        <span aria-label="Symbol Info" className="text-sm text-white cursor-help" title="A single Unicode symbol for the rune, e.g., $, 😎">&#9432;</span>
      </label>
      <input type="text" id="symbol" name="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-md text-lg" />
    </div>
  
    {/* Cap Section */}
    <div className="mb-6">
      <label htmlFor="cap" className="block mb-2 font-semibold text-white">
        Cap
        <span aria-label="Cap Info" className="text-sm text-white cursor-help" title="Maximum times the rune can be minted">&#9432;</span>
      </label>
      <input type="number" id="cap" min="0" value={cap} onChange={(e) => setCap(Number(e.target.value))} required className="w-full p-3 border border-gray-300 rounded-md text-lg" />
    </div>
  
    {/* Amount Section */}
    <div className="mb-6">
      <label htmlFor="amount" className="block mb-2 font-semibold text-white">
        Amount
        <span aria-label="Amount Info" className="text-sm text-white cursor-help" title="Fixed amount created per mint transaction">&#9432;</span>
      </label>
      <input type="number" id="amount" name="amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required className="w-full p-3 border border-gray-300 rounded-md text-lg" />
    </div>
  
    {/* Premine Section */}
    <div className="mb-6">
      <label htmlFor="premine" className="block mb-2 font-semibold text-white">
        Premine
        <span aria-label="Premine Info" className="text-sm text-white cursor-help" title="Optional allocation for the etcher, up to 100%">&#9432;</span>
      </label>
      <input type="range" id="premine" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))} min="0" max="100" required className="w-full" />
      <span>{percentage}%</span>
    </div>
  
    {/* Mint Term Section */}
    <div className="mb-6">
      <label htmlFor="mint-term" className="block mb-2 font-semibold text-white">
        Set Mint Term with
        <span aria-label="Mint Term Info" className="text-sm text-white cursor-help" title="Specify minting period using Height or Offset">&#9432;</span>
      </label>
      <div className="flex space-x-4 mb-4">
        <label className={`flex items-center space-x-2 cursor-pointer ${withBlockHeight ? '' : ''}`}>
          <input type="radio" name="mint-term" value="height" checked={withBlockHeight} onChange={() => setWithBlockHeight(true)} className="form-radio text-blue-500" />
          <span>Using Height</span>
        </label>
        <label className={`flex items-center space-x-2 cursor-pointer ${!withBlockHeight ? '' : ''}`}>
          <input type="radio" name="mint-term" value="offset" checked={!withBlockHeight} onChange={() => setWithBlockHeight(false)} className="form-radio text-blue-500" />
          <span>Using Offset</span>
        </label>
      </div>
      {withBlockHeight ? (
        <>
          <label htmlFor="startHeight" className="block mt-2 mb-2 font-semibold text-white">Start Height</label>
          <input type="number" id="startHeight" name="startHeight" min="0" value={startHeight} onChange={(e) => setStartHeight(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-md text-lg" />
          
          <label htmlFor="endHeight" className="block mt-2 mb-2 font-semibold text-white">End Height</label>
          <input type="number" id="endHeight" name="endHeight" min="0" value={endHeight} onChange={(e) => setEndHeight(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-md text-lg" />
        </>
      ) : (
        <>
          <label htmlFor="startOffset" className="block mt-2 mb-2 font-semibold text-white">Start Offset</label>
          <input type="number" id="startOffset" name="startOffset" min="0" value={startOffset} onChange={(e) => setStartOffset(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-md text-lg" />
          
          <label htmlFor="endOffset" className="block mt-2 mb-2 font-semibold text-white">End Offset</label>
          <input type="number" id="endOffset" name="endOffset" min="0" value={endOffset} onChange={(e) => setEndOffset(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-md text-lg" />
        </>
      )}
    </div>
  
    <button type="submit" className="w-full bg-blue-500 text-white py-3 mt-6 rounded-lg font-semibold hover:bg-blue-600">Etch Rune</button>
  </div>
  
  
  );
};

export default Etcher;
