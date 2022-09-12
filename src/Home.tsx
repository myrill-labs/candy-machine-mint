import {ReactElement, useEffect} from "react";
import styled from "styled-components";
import {Button, Link} from "@material-ui/core";
import * as anchor from "@project-serum/anchor";


export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    config: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    startDate: number;
    treasury: anchor.web3.PublicKey;
    txTimeout: number;
}

const Home = (props: HomeProps) => {

    const ColorButton = styled(Button)(({theme}) => ({

        backgroundColor: "rgba(25, 200, 255, 0.1)",
        color: "white",
        '&:hover': {
            color: "rgba(100, 100, 255, 0.8)",
            backgroundColor: "pink"
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


    const onMint = () => {
    };

    return (
        <main>


            <div className="space-30"/>


            <div className={"mintDiv"}>
                <div className="space-30"/>
                <div style={{margin: "15px", justifyContent: 'center', alignItems: 'center'}}>
                    This NFT unlocks a right to deposit the equivalent of $10k of liquidity to the Myrill protocol.
                    <br/><br/>
                    Note that this is a pre-sale and the protocol is still in R&D.
                </div>
                <br/>
                <br/>
                <img
                    className={"NFT"}
                    src={"https://arweave.net/9icLE0p82yTCnjWVW9tTSQ3NOc_ajGnuUjA5cvE2Sus?ext=png"}
                    alt="NFT"/>

                <div className="space-10"/>
                <div>
                    <p>price: <SolIcon/> 5 </p>
                    <Link href={"https://myrill.io/discord"}>
                        <ColorButton
                            onClick={onMint}
                            variant="contained">
                            PRIVATE SALE ARE NOW ON DISCORD
                        </ColorButton>
                    </Link>
                    <div className="space-30"/>
                </div>

            </div>
            <div className="space-30"/>
        </main>
    );
};

export default Home;
