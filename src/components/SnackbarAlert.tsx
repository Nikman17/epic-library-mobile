import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Slide, { SlideProps } from "@mui/material/Slide";

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
}

interface SnackbarAlertProps {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    loadingIcon?: boolean;
    onClose: () => void;
}

export default function SnackbarAlert(props: SnackbarAlertProps) {
    const { open, message, severity, loadingIcon, onClose } = props;

    return (
        <Snackbar
            open={open}
            autoHideDuration={loadingIcon ? null : 6000}
            onClose={onClose}
            slots={{ transition: SlideTransition }}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                severity={severity}
                variant='filled'
                sx={{
                    width: '100%',
                    color: 'white',
                    '& .MuiAlert-message': {
                        color: 'white',
                    }
                }}
                onClose={onClose}
                icon={loadingIcon ? <CircularProgress size={24} color='inherit' /> : undefined}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}