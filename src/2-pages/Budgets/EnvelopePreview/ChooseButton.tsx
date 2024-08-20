import * as React from 'react';
import { KeyboardArrowDownOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import { ClickAwayListener, Grow, Paper, Popper, MenuItem, MenuList, Button } from '@mui/material';

type ChooseButtonProps = {
  chosen?: any
  elements: any[]
  onChoose: (value: any) => void
  renderValue?: (value: any) => React.ReactNode
}

export default function ChooseButton(props: ChooseButtonProps) {
  const {chosen, elements, onChoose} = props
  let chosen2 = chosen
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  let selected = elements.findIndex(d => d === chosen)
  if (selected === -1) {
    chosen2 = elements[0]
    selected = 0
  }

  const handleMenuItemClick = (
    index: number,
  ) => {
    onChoose(elements[index])
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button
        size="small"
        ref={anchorRef}
        aria-controls={open ? 'split-button-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-label="select merge strategy"
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        {props.renderValue ? props.renderValue(chosen2) : chosen2}
        {open ? <KeyboardArrowDownOutlined fontSize='small'/> : <KeyboardArrowRightOutlined fontSize='small'/>}
      </Button>

      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {elements.map((option, index) => (
                    <MenuItem
                      key={option}
                      selected={index === selected}
                      onClick={() => handleMenuItemClick(index)}
                    >
                      {props.renderValue ? props.renderValue(option) : option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}
