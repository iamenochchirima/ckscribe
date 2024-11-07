import React, { useState } from 'react';;
import PayWithBtc from './PayWithBtc';
import PayWithCkBtc from './PayWithCkBTC';
import Button from './Button';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/Context';
import { EtchingArgs } from '../../../declarations/etcher_backend/etcher_backend.did';

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

  const { backendActor} = useAuth();

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
      const result = await backendActor.etch_rune(arg);
      console.log(result);
        toast.success('Successfully submitted the Commit Transaction');
    } catch (e) {
      console.error(e);
        toast.error(`Failed to Etch Rune: ${e.toString()}`);
    }
  };

  return (
    <form onSubmit={etchRune} className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg font-sans">
    <label htmlFor="payment-mode" className="block mb-2 font-semibold text-gray-800">
      Pay Fee
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        Pay Fee for Etching with Bitcoin or CkBTC
      </div>
    </label>
  
    <div className="flex space-x-4 mb-4">
      <label
        className={`flex items-center space-x-2 cursor-pointer ${payWithBtc ? 'bg-green-100' : ''}`}
      >
        <input
          type="radio"
          name="option"
          value="payWithBtc"
          checked={payWithBtc}
          onChange={() => setPayWithBtc(true)}
          className="form-radio text-blue-500"
        />
        <span>Pay with Bitcoin</span>
      </label>
      <label
        className={`flex items-center space-x-2 cursor-pointer ${!payWithBtc ? 'bg-green-100' : ''}`}
      >
        <input
          type="radio"
          name="option"
          value="Pay with CkBTC"
          checked={!payWithBtc}
          onChange={() => setPayWithBtc(false)}
          className="form-radio text-blue-500"
        />
        <span>Pay with CkBTC</span>
      </label>
    </div>
  
    {payWithBtc ? <PayWithBtc /> : <PayWithCkBtc />}
  
    <label htmlFor="rune" className="block mb-2 font-semibold text-gray-800">
      Rune
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        Names consist of the letters A through Z and are between one and twenty-six letters long.
      </div>
    </label>
    <input
      type="text"
      id="rune"
      name="rune"
      value={rune}
      onChange={(e) => setRune(e.target.value)}
      required
      className="w-full p-3 border border-gray-300 rounded-md text-lg"
    />
  
    <label htmlFor="divisibility" className="block mt-6 mb-2 font-semibold text-gray-800">
      Divisibility
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        A rune's divisibility is how finely it may be divided into its atomic units.
      </div>
    </label>
    <input
      type="number"
      id="divisibility"
      name="divisibility"
      min="0"
      max="38"
      value={divisibility}
      onChange={(e) => setDivisibility(Number(e.target.value))}
      required
      className="w-full p-3 border border-gray-300 rounded-md text-lg"
    />
  
    <label htmlFor="symbol" className="block mt-6 mb-2 font-semibold text-gray-800">
      Symbol
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        A rune's currency symbol is a single Unicode code point, for example $, 😎, or 🧿, displayed after quantities of that rune.
      </div>
    </label>
    <input
      type="text"
      id="symbol"
      name="symbol"
      value={symbol}
      onChange={(e) => setSymbol(e.target.value)}
      required
      className="w-full p-3 border border-gray-300 rounded-md text-lg"
    />
  
    <label htmlFor="cap" className="block mt-6 mb-2 font-semibold text-gray-800">
      Cap
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        The number of times a rune may be minted is its cap. A mint is closed once the cap is reached.
      </div>
    </label>
    <input
      type="number"
      id="cap"
      min="0"
      value={cap}
      onChange={(e) => setCap(Number(e.target.value))}
      required
      className="w-full p-3 border border-gray-300 rounded-md text-lg"
    />
  
    <label htmlFor="amount" className="block mt-6 mb-2 font-semibold text-gray-800">
      Amount
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        Each mint transaction creates a fixed amount of new units of a rune.
      </div>
    </label>
    <input
      type="number"
      id="amount"
      name="amount"
      value={amount}
      onChange={(e) => setAmount(Number(e.target.value))}
      required
      className="w-full p-3 border border-gray-300 rounded-md text-lg"
    />
  
    <br />
    <label htmlFor="premine" className="block mt-6 mb-2 font-semibold text-gray-800">
      Premine
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        The etcher of a rune may optionally allocate to themselves units of the rune being etched.
        When set to 100%, Runestone becomes unmintable.
      </div>
    </label>
    <input
      type="range"
      id="premine"
      value={percentage}
      onChange={(e) => setPercentage(Number(e.target.value))}
      min="0"
      max="100"
      required
      className="w-full"
    />
    <span>{percentage}%</span>
  
    <br />
    <label htmlFor="button-separator" className="block mt-6 mb-2 font-semibold text-gray-800">
      Set Mint Term with
      <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
        &#9432;
      </span>
      <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
        Set mint Term using either Height or Offset
      </div>
    </label>
    <div className="flex space-x-4 mb-4">
      <label
        className={`flex items-center space-x-2 cursor-pointer ${withBlockHeight ? 'bg-green-100' : ''}`}
      >
        <input
          type="radio"
          name="option"
          value="Using Height"
          checked={withBlockHeight}
          onChange={() => setWithBlockHeight(true)}
          className="form-radio text-blue-500"
        />
        <span>Using Height</span>
      </label>
      <label
        className={`flex items-center space-x-2 cursor-pointer ${!withBlockHeight ? 'bg-green-100' : ''}`}
      >
        <input
          type="radio"
          name="option"
          value="Using Offset"
          checked={!withBlockHeight}
          onChange={() => setWithBlockHeight(false)}
          className="form-radio text-blue-500"
        />
        <span>Using Offset</span>
      </label>
    </div>
  
    {withBlockHeight ? (
      <>
        <label htmlFor="startHeight" className="block mt-6 mb-2 font-semibold text-gray-800">
          Start Height
          <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
            &#9432;
          </span>
          <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
            The Mint is Open starting in the block with the given height.
          </div>
        </label>
        <input
          type="number"
          id="startHeight"
          name="startHeight"
          min="0"
          value={startHeight}
          onChange={(e) => setStartHeight(Number(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-md text-lg"
        />
  
        <label htmlFor="endHeight" className="block mt-6 mb-2 font-semibold text-gray-800">
          End Height
          <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
            &#9432;
          </span>
          <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
            The Mint is Closed once the given height is reached.
          </div>
        </label>
        <input
          type="number"
          id="endHeight"
          name="endHeight"
          min="0"
          value={endHeight}
          onChange={(e) => setEndHeight(Number(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-md text-lg"
        />
      </>
    ) : (
      <>
        <label htmlFor="startOffset" className="block mt-6 mb-2 font-semibold text-gray-800">
          Start Offset
          <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
            &#9432;
          </span>
          <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
            The Mint is Open starting at this block offset.
          </div>
        </label>
        <input
          type="number"
          id="startOffset"
          name="startOffset"
          min="0"
          value={startOffset}
          onChange={(e) => setStartOffset(Number(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-md text-lg"
        />
  
        <label htmlFor="endOffset" className="block mt-6 mb-2 font-semibold text-gray-800">
          End Offset
          <span className="text-sm text-gray-600 cursor-help" title="Additional Information">
            &#9432;
          </span>
          <div className="mt-2 p-3 bg-gray-200 rounded-md text-gray-600 text-sm leading-6">
            The Mint is Closed once this block offset is reached.
          </div>
        </label>
        <input
          type="number"
          id="endOffset"
          name="endOffset"
          min="0"
          value={endOffset}
          onChange={(e) => setEndOffset(Number(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-md text-lg"
        />
      </>
    )}
  
    <div className="mt-8">
      <button
        type="submit"
        className="w-full py-3 bg-blue-500 text-white rounded-md text-lg hover:bg-blue-600 transition duration-300"
      >
        Confirm
      </button>
    </div>
  </form>
  
  );
};

export default Etcher;
