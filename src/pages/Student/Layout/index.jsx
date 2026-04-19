import { Flex, Box } from "@chakra-ui/react";
import { Sidebar } from "../index";
import { Outlet } from 'react-router';

export const Layout = () => {
  return (
    <Flex h="100vh" w="100vw" overflow="hidden">
      <Sidebar />
      <Box flex="1" overflowY="auto" bg="bg.subtle" position="relative">
        <Outlet /> 
      </Box>
    </Flex>
  );
};