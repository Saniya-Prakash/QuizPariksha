import { Flex, Box } from "@chakra-ui/react";
import { Sidebar } from "../index";
import { Outlet } from 'react-router';

const Layout = ({ withIcons }) => {
  return (
    // 1. Create a Flex container that fills the viewport
    <Flex h="100vh" w="100vw" overflow="hidden">
      
      {/* 2. Render Sidebar. 
         As a flex child, it will take up its natural width 
         (defined inside your Sidebar component) and push the content content.
      */}
      <Sidebar withIcons={withIcons} />
      
      {/* 3. Main Content Area.
         flex="1" ensures this Box takes up all REMAINING space.
         overflowY="auto" ensures only this area scrolls while Sidebar stays still.
      */}
      <Box flex="1" overflowY="auto" bg="bg.subtle" position="relative">
        <Outlet /> 
      </Box>
      
    </Flex>
  );
};

export { Layout };