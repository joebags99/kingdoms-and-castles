import React from 'react';
import './App.css';
import Battlefield from './components/battlefield/Battlefield';
import styled from 'styled-components';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1.2rem;
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <Title>Kingdoms & Castles</Title>
        <Subtitle>A Tactical Card Game on a Hexagonal Battlefield</Subtitle>
      </Header>
      
      <Battlefield width={13} height={9} hexSize={30} />
    </AppContainer>
  );
}

export default App;