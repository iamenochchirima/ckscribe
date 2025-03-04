import React, { useState, useEffect, useRef, useContext } from 'react';
//@ts-ignore
import icblast from "@infu/icblast"
import { FaRegCopy } from "react-icons/fa6";
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/Context';
import { Account } from '../../../declarations/ckbtc_minter/ckbtc_minter.did';
import { useSiwbIdentity } from 'ic-siwb-lasereyes-connector';
import { useLaserEyes } from '@omnisat/lasereyes';




type Ids = {
    principal: string;
    aid: string;
}

const ConnectedButton = () => {
    const [btcBalance, setBtcBalance] = useState<number | null>(null);
    const [ckBTCBalance, setCKBTCBalance] = useState<number | null>(null);
    const [ids, setIds] = useState<Ids>({ principal: "", aid: "" });
    const { inscribeActor, ckbtcLedgerActor } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const { identity, identityAddress, clear } = useSiwbIdentity();
    const p = useLaserEyes();

    useEffect(() => {
        if (inscribeActor && identity) {
            getBalances();
        }
    }, [inscribeActor, identity]);

    const getBalances = async () => {
        const btcBal = await p.getBalance();
        setBtcBalance(Number(btcBal) * 0.00000001);
        if (!inscribeActor || !identity) return;
        try {
            const user: Account = {
                owner: identity.getPrincipal(),
                subaccount: []
            };

            const ckbtcBalance = await ckbtcLedgerActor.icrc1_balance_of(user);
            // const btcBalance = await inscribeActor.get_adddress_balance(identityAddress);
            setCKBTCBalance(Number(ckbtcBalance));
            // setBtcBalance(Number(btcBalance));
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.log("Error in getting balances: ", error);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };


    const truncateId = (id: string, length = 6) => {
        if (id.length <= length * 2) return id;
        return `${id.slice(0, length)}...${id.slice(-length)}`;
    };


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    console.log("btc balance: ", btcBalance);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    id="menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={toggleDropdown}
                >
                    Connected
                    <svg
                        className="-mr-1 h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                >
                    <div className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700" role="none">
                    <div className="flex items-center justify-between mt-1">
                            <p><strong>BTC Address:</strong></p>
                            <div className="flex items-center gap-1 cursor-pointer text-blue-500" onClick={() => copyToClipboard(ids.aid)}>
                                <span>{truncateId(identityAddress, 6)}</span>
                                <FaRegCopy />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p><strong>Principal ID:</strong></p>
                            <div className="flex items-center gap-1 cursor-pointer text-blue-500" onClick={() => copyToClipboard(ids.principal)}>
                                <span>{truncateId(identity?.getPrincipal().toString(), 6)}</span>
                                <FaRegCopy />
                            </div>
                        </div>   
                    </div>

                    <div className="py-3 px-4" role="none">
                        <h3 className="text-sm font-semibold text-gray-800">Balances</h3>
                        {loading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                           
                        ) : (
                            <ul className="mt-2 space-y-1">

                                <li className="flex justify-between text-sm text-gray-700">
                                    <span>BTC</span>
                                    <span>
                                        {btcBalance} BTC
                                    </span>
                                </li>
                                <li className="flex justify-between text-sm text-gray-700">
                                    <span>ckBTC</span>
                                    <span>
                                        {ckBTCBalance} ckBTC
                                    </span>
                                </li>
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-200" role="none">
                        <button
                            onClick={clear}
                            className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectedButton;
