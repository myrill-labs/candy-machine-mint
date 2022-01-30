import {ReactElement, useEffect, useState} from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import {Button, CircularProgress, Grid, Snackbar} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import * as anchor from "@project-serum/anchor";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletDialogButton} from "@solana/wallet-adapter-material-ui";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)`

`; // add your styles here

export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    config: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    startDate: number;
    treasury: anchor.web3.PublicKey;
    txTimeout: number;
}

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isActive, setIsActive] = useState(false); // true when countdown completes
    const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const [startDate, setStartDate] = useState(new Date(props.startDate));

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const {
                candyMachine,
                goLiveDate,
                itemsAvailable,
                itemsRemaining,
                itemsRedeemed,
            } = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                props.connection
            );

            setItemsAvailable(itemsAvailable);
            setItemsRemaining(itemsRemaining);
            setItemsRedeemed(itemsRedeemed);

            setIsSoldOut(itemsRemaining === 0);
            setStartDate(goLiveDate);
            setCandyMachine(candyMachine);
        })();
    };

    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program) {
                const mintTxId = await mintOneToken(
                    candyMachine,
                    props.config,
                    wallet.publicKey,
                    props.treasury
                );

                const status = await awaitTransactionSignatureConfirmation(
                    mintTxId,
                    props.txTimeout,
                    props.connection,
                    "singleGossip",
                    false
                );

                if (!status?.err) {
                    setAlertState({
                        open: true,
                        message: "Congratulations! Mint succeeded!",
                        severity: "success",
                    });
                } else {
                    setAlertState({
                        open: true,
                        message: "Mint failed! Please try again!",
                        severity: "error",
                    });
                }
            }
        } catch (error: any) {
            // TODO: blech:
            let message = error.msg || "Minting failed! Please try again!";
            if (!error.msg) {
                if (error.message.indexOf("0x138")) {
                } else if (error.message.indexOf("0x137")) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf("0x135")) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                    setIsSoldOut(true);
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
            setIsMinting(false);
            refreshCandyMachineState();
        }
    };

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    useEffect(refreshCandyMachineState, [
        wallet,
        props.candyMachineId,
        props.connection,
    ]);

    const ColorButton = styled(Button)(({theme}) => ({

        backgroundColor: "rgba(25, 200, 255, 0.1)",
        color: "white",
        '&:hover': {
            color: "rgba(100, 100, 255, 0.8)",
            backgroundColor: "pink"
        },
    }));

    const MenuButton = styled(Button)(({theme}) => ({
        color: "white",
        backgroundColor: "none",
        '&:hover': {
            backgroundColor: "pink",
            color: "rgba(100, 100, 255, 0.8)"
        },
    }));

    const SolIcon: React.FC = (): ReactElement => {
        return <img
            style={{"width": "25px", "transform": "translateY(5px)"}}
            src={"https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png"}/>
    }

    useEffect(() => {
        document.title = "Join Myrill"
    }, []);

    // @ts-ignore
    function myFunction() {
        let x = document.getElementById("myTopnav");
        // @ts-ignore
        if (x.className === "topnav") {
            // @ts-ignore
            x.className += " responsive";
        } else {
            // @ts-ignore
            x.className = "topnav";
        }
    }

    return (
        <main>

            <div className="topnav" id="myTopnav">

                <a href="https://myrill.io/">
                    <img style={{"height": "22px", "position": "relative", "top": "-3px;"}} alt="logo"
                         src="https://myrill.io/assets/img/logo/logo2.svg"/>
                </a>
                <a href="https://myrill.io/club">Club</a>
                <a href="https://myrill.io/whitepaper">White Paper</a>
                <a href="https://myrill.io/mint">Buy NFT</a>
                <a href="https://myrill.io/marketplace">Marketplace</a>
                <a href="https://myrill.io/talks">Talks</a>
                <a href="https://myrill.io/blog">Blog</a>
                <a href="https://myrill.io/career">Career</a>

                <a href="https://myrill.io/discord">
                    <svg height="16px" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="discord"
                         className="svg-inline--fa fa-discord fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 640 512">
                        <path fill="currentColor"
                              d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path>
                    </svg>
                </a>
                <a href="https://myrill.io/twitter">
                    <svg height="16px" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="twitter"
                         className="svg-inline--fa fa-twitter fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 512 512">
                        <path fill="currentColor"
                              d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                    </svg>
                </a>
                <a href="https://myrill.io/linkedin">
                    <svg height="16px" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="linkedin-in"
                         className="svg-inline--fa fa-linkedin-in fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 448 512">
                        <path fill="currentColor"
                              d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path>
                    </svg>
                </a>
                <a href="https://myrill.io/instagram">
                    <svg height="16px" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="instagram"
                         className="svg-inline--fa fa-instagram fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 448 512">
                        <path fill="currentColor"
                              d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                    </svg>
                </a>

                <a href="javascript:void(0);" className="icon" onClick={myFunction}>
                    <svg height="16px" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bars"
                         className="svg-inline--fa fa-bars fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 448 512">
                        <path fill="currentColor"
                              d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
                    </svg>
                </a>
            </div>


            <div style={{"margin": "15px"}}>

                <div className={"walletDiv"}>
                    {wallet && (
                        <p>
                            Wallet {shortenAddress(wallet.publicKey.toBase58() || "")}
                            <div style={{"marginRight": "10px"}}/>
                            <SolIcon/> {(balance || 0).toLocaleString()}

                        </p>
                    )}
                </div>
            </div>

            <div className="space-30"/>

            <div className={"mintDiv"}>
                <div className="space-30"/>

                <img
                    className={"NFT"}
                    src={"https://arweave.net/9icLE0p82yTCnjWVW9tTSQ3NOc_ajGnuUjA5cvE2Sus?ext=png"}
                    alt="NFT"/>

                <div className="space-10"/>
                <div>


                    {wallet && <p>Total Available: {itemsAvailable}</p>}

                    {wallet && <p>Redeemed: {itemsRedeemed}</p>}

                    {wallet && <p>Remaining: {itemsRemaining}</p>}

                    <p>price: <SolIcon/> 5 </p>

                    <MintContainer>
                        {!wallet ? (
                            <ConnectButton>Connect Wallet</ConnectButton>
                        ) : (
                            <ColorButton
                                disabled={isSoldOut || isMinting || !isActive}
                                onClick={onMint}
                                variant="contained"
                            >
                                {isSoldOut ? (
                                    "SOLD OUT"
                                ) : isActive ? (
                                    isMinting ? (
                                        <CircularProgress/>
                                    ) : (
                                        "BUY NFT"
                                    )
                                ) : (
                                    <Countdown
                                        date={startDate}
                                        onMount={({completed}) => completed && setIsActive(true)}
                                        onComplete={() => setIsActive(true)}
                                        renderer={renderCounter}
                                    />
                                )}
                            </ColorButton>
                        )}
                    </MintContainer>

                    <Snackbar
                        open={alertState.open}
                        autoHideDuration={6000}
                        onClose={() => setAlertState({...alertState, open: false})}
                    >
                        <Alert
                            onClose={() => setAlertState({...alertState, open: false})}
                            severity={alertState.severity}
                        >
                            {alertState.message}
                        </Alert>
                    </Snackbar>
                    <div className="space-30"/>
                </div>

            </div>
            <div className="space-30"/>
        </main>
    );
};

interface AlertState {
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({days, hours, minutes, seconds, completed}: any) => {
    return (
        <CounterText>
            {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
        </CounterText>
    );
};

export default Home;
