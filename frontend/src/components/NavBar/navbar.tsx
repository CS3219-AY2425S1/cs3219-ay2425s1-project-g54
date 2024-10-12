import * as React from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import PeopleIcon from "@mui/icons-material/People";
import MatchingDialog from "../Matching/matching";

const settings = ["Settings", "Logout"];

function NavBar() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const [matchScreenOpen, setMatchScreenOpen] = React.useState(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMatchScreenOpen = () => {
    setMatchScreenOpen(true);
  }

  const handleMatchScreenClose = () => {
    setMatchScreenOpen(false);
  }

  return (
    <Box>
      <AppBar position="static" sx={{ width: "100vw", backgroundColor: "#262928" }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Link to="/">
              <img className="h-12 mr-6" alt="peerprep logo" src="/logo-with-text.svg" />
            </Link>
            <Button
              variant="contained"
              onClick={() => handleMatchScreenOpen()}
              startIcon={<PeopleIcon />}
              sx={{ mx: 3, borderRadius: 20 }}
              color="secondary"
            >
              Find Peer
            </Button>
            {/* Flexible space to push avatar to the right */}
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: "center" }}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
      <MatchingDialog open={matchScreenOpen} handleMatchScreenClose={handleMatchScreenClose}/>
    </Box>
  );
}
export default NavBar;
