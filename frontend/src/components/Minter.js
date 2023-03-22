import { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/DynamicWeatherCard.json";

const initialInfoState = {
    connected: false,
    status: null,
    account: null,
    web3: null,
    contract: null,
    address: null,
    contractJSON: null,
};

const initialMintState = {
    loading: false,
    status: `Mint your ${contract.contractName}`,
    amount: 1,
    supply: "0",
    cost: "0",
};

function Minter() {
    const [info, setInfo] = useState(initialInfoState);
    const [mintInfo, setMintInfo] = useState(initialMintState);

    console.log(info);

    const init = async (_request, _contractJSON) => {
        if (window.ethereum.isMetaMask) {
            try {
                const accounts = await window.ethereum.request({
                    method: _request,
                });
                const networkId = await window.ethereum.request({
                    method: "net_version",
                });
                if (networkId == _contractJSON.chain_id) {
                    let web3 = new Web3(window.ethereum);
                    setInfo((prevState) => ({
                        ...prevState,
                        connected: true,
                        status: null,
                        account: accounts[0],
                        web3: web3,
                        contract: new web3.eth.Contract(
                            _contractJSON.abi,
                            _contractJSON.address
                        ),
                        contractJSON: _contractJSON,
                    }));
                } else {
                    setInfo(() => ({
                        ...initialInfoState,
                        status: `Change network to ${_contractJSON.chain}.`,
                    }));
                }
            } catch (err) {
                console.log(err.message);
                setInfo(() => ({
                    ...initialInfoState,
                }));
            }
        } else {
            setInfo(() => ({
                ...initialInfoState,
                status: "Please install metamask.",
            }));
        }
    };

    const initListeners = () => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", () => {
                window.location.reload();
            });
            window.ethereum.on("chainChanged", () => {
                window.location.reload();
            });
        }
    };

    const mint = async () => {
        const params = {
            to: info.contractJSON.address,
            from: info.account,
            data: info.contract.methods
                .safeMint(info.account, mintInfo.city)
                .encodeABI(),
        };
        try {
            setMintInfo((prevState) => ({
                ...prevState,
                loading: true,
                status: `Minting...`,
            }));
            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [params],
            });
            setMintInfo((prevState) => ({
                ...prevState,
                loading: false,
                status:
                    "Nice! Your NFT will show up on Opensea, once the transaction is successful.",
            }));
        } catch (err) {
            setMintInfo((prevState) => ({
                ...prevState,
                loading: false,
                status: err.message,
            }));
        }
    };

    const updateCity = (city) => {
        setMintInfo((prevState) => ({
            ...prevState,
            city: city,
        }));
    }

    const connectToContract = (_contractJSON) => {
        init("eth_requestAccounts", _contractJSON);
    };

    useEffect(() => {
        connectToContract(contract);
        initListeners();
    }, []);

    return (
        <div className="card">
            <div className="card_header colorGradient">
                <img className="card_header_image ns" alt={"banner"} src='/pollution.png' />
            </div>

            <div className="card_body">
                <label for="city">Your city:</label>
                <input type="text" id="city" name="city" onChange={e => { updateCity(e.currentTarget.value) }} />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "1em",
                    }}
                >
                    <div style={{ width: 10 }}></div>
                    <button
                        disabled={!info.connected}
                        className="button"
                        onClick={() => mint()}
                    >
                        Mint {mintInfo.amount}
                    </button>
                    <div style={{ width: 10 }}></div>
                </div>
                {info.connected ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                            {info.web3?.utils.fromWei(mintInfo.cost, "ether") *
                                mintInfo.amount}{" "}
                            {contract.chain_symbol}
                        </p>
                    </div>
                ) : null}
                {mintInfo.status ? (
                    <p className="statusText">{mintInfo.status}</p>
                ) : null}
                {info.status ? (
                    <p className="statusText" style={{ color: "var(--error)" }}>
                        {info.status}
                    </p>
                ) : null}
            </div>
            <div className="card_footer colorGradient">
                <button
                    className="button"
                    style={{
                        backgroundColor: info.connected
                            ? "var(--success)"
                            : "var(--warning)",
                    }}
                    onClick={() => connectToContract(contract)}
                >
                    {info.account ? "Connected" : "Connect Wallet"}
                </button>
                {info.connected ? (
                    <span className="accountText">
                        {String(info.account).substring(0, 6) +
                            "..." +
                            String(info.account).substring(38)}
                    </span>
                ) : null}
            </div>
            <a
                style={{
                    position: "absolute",
                    bottom: 55,
                    left: -75,
                }}
                className="_90"
                target="_blank"
                href="https://mumbai.polygonscan.com/token/0x1c6A6E29cECb6F52c5418a88F70C7c64ee06c787"
            >
                View Contract
            </a>
        </div>
    );
}

export default Minter;