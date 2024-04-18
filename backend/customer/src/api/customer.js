const CustomerService = require('../services/customerServices');
//const  UserAuth = require('./middlewares/auth');



exports.customer = (app) => {
    
    const service = new CustomerService();

    // To listen
    service.SubscribeEvents();

    app.post('/signup', async (req,res,next) => {
        const { email, phone, image, password, first_name, last_name } = req.body;
        const { data } = await service.SignUp({ email, phone, image, password, first_name, last_name }); 
        res.json(data);

    });

    app.post('/login',  async (req,res,next) => {
        
        const { email, password } = req.body;
        const { data } = await service.SignIn({ email, password});
        res.json(data);

    });

    app.post('/address', async (req,res,next) => {
        
        const { _id } = req.user;


        const { street, postalCode, city,country } = req.body;

        const { data } = await service.AddNewAddress( _id ,{ street, postalCode, city,country});

        res.json(data);

    });
     

    app.get('/profile' ,async (req,res,next) => {

        const { _id } = req.user;
        const { data } = await service.GetProfile({ _id });
        res.json(data);
    });
     

    app.get('/cart', async (req, res, next) => {
        try {
            const _id = 1; // Not sure what this is used for, you can remove it if not needed
            const { data }  = await service.getUserCart(1);
            return res.status(200).json(data);
        } catch (error) {
        return res.status(404).json({ error });
        }
    });
    
    
    app.get('/checkout', async (req,res,next) => {
        const { _id } =1 ;
        await service.checkOutOrder( 1);
        return res.status(200);
    });
};