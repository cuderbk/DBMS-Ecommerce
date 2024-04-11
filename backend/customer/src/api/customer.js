const CustomerService = require('../services/customerServices');
//const  UserAuth = require('./middlewares/auth');



exports.customer = (app) => {
    
    const service = new CustomerService();

    // To listen
    service.SubscribeEvents();

    // app.post('/signup', async (req,res,next) => {
    //     const { email, password, phone } = req.body;
    //     const { data } = await service.SignUp({ email, password, phone}); 
    //     res.json(data);

    // });

    // app.post('/login',  async (req,res,next) => {
        
    //     const { email, password } = req.body;
    //     const { data } = await service.SignIn({ email, password});
    //     res.json(data);

    // });

    // app.post('/address', UserAuth, async (req,res,next) => {
        
    //     const { _id } = req.user;


    //     const { street, postalCode, city,country } = req.body;

    //     const { data } = await service.AddNewAddress( _id ,{ street, postalCode, city,country});

    //     res.json(data);

    // });
     

    // app.get('/profile', UserAuth ,async (req,res,next) => {

    //     const { _id } = req.user;
    //     const { data } = await service.GetProfile({ _id });
    //     res.json(data);
    // });
     

    app.get('/cart', async (req, res, next) => {
        try {
            const _id = 1; // Not sure what this is used for, you can remove it if not needed
            const data = await service.getUserCart(1);
            return res.json(data);
        } catch (error) {
            console.error('Error fetching user cart:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    
    app.get('/checkout', async (req,res,next) => {
        const { _id } =1 ;
        await service.checkOutOrder( 1);
        return res.status(200);
    });
};